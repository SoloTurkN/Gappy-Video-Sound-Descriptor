"""
Stripe Payment Routes for Gappy Describe Subscriptions
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional
import os
import logging
from datetime import datetime, timezone

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout, 
    CheckoutSessionRequest, 
    CheckoutSessionResponse,
    CheckoutStatusResponse
)

# Import database and auth dependencies
import sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dependencies import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

logger = logging.getLogger(__name__)

# Subscription packages - prices defined server-side only (security)
SUBSCRIPTION_PACKAGES = {
    "pro_monthly": {
        "name": "Pro Monthly",
        "amount": 9.99,
        "currency": "usd",
        "tier": "pro",
        "billing_period": "monthly",
        "features": [
            "50 videos per month",
            "Unlimited video duration",
            "All export formats (MP4, AVI, MOV)",
            "Priority processing"
        ]
    },
    "pro_yearly": {
        "name": "Pro Yearly",
        "amount": 99.99,
        "currency": "usd",
        "tier": "pro",
        "billing_period": "yearly",
        "features": [
            "50 videos per month",
            "Unlimited video duration",
            "All export formats (MP4, AVI, MOV)",
            "Priority processing",
            "2 months free!"
        ]
    },
    "enterprise_monthly": {
        "name": "Enterprise Monthly",
        "amount": 49.99,
        "currency": "usd",
        "tier": "enterprise",
        "billing_period": "monthly",
        "features": [
            "Unlimited videos",
            "Unlimited video duration",
            "All export formats",
            "Priority support",
            "API access",
            "Custom integrations"
        ]
    },
    "enterprise_yearly": {
        "name": "Enterprise Yearly",
        "amount": 499.99,
        "currency": "usd",
        "tier": "enterprise",
        "billing_period": "yearly",
        "features": [
            "Unlimited videos",
            "Unlimited video duration",
            "All export formats",
            "Priority support",
            "API access",
            "Custom integrations",
            "2 months free!"
        ]
    }
}


class CheckoutRequest(BaseModel):
    """Request model for creating checkout session"""
    package_id: str  # e.g., "pro_monthly", "pro_yearly"
    origin_url: str  # Frontend origin URL


class PaymentStatusRequest(BaseModel):
    """Request model for checking payment status"""
    session_id: str


@router.get("/packages")
async def get_packages():
    """Get available subscription packages"""
    return {
        "packages": [
            {
                "id": pkg_id,
                "name": pkg["name"],
                "amount": pkg["amount"],
                "currency": pkg["currency"],
                "tier": pkg["tier"],
                "billing_period": pkg["billing_period"],
                "features": pkg["features"]
            }
            for pkg_id, pkg in SUBSCRIPTION_PACKAGES.items()
        ]
    }


@router.post("/checkout")
async def create_checkout_session(
    checkout_req: CheckoutRequest,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Create a Stripe checkout session for subscription purchase"""
    try:
        # Validate package
        if checkout_req.package_id not in SUBSCRIPTION_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package selected")
        
        package = SUBSCRIPTION_PACKAGES[checkout_req.package_id]
        
        # Check if user already has this tier or higher
        current_tier = current_user.get("subscription_tier", "free")
        if current_tier == "enterprise":
            raise HTTPException(status_code=400, detail="You already have the highest tier subscription")
        if current_tier == "pro" and package["tier"] == "pro":
            raise HTTPException(status_code=400, detail="You already have a Pro subscription")
        
        # Get Stripe API key
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        if not stripe_api_key:
            logger.error("STRIPE_API_KEY not configured")
            raise HTTPException(status_code=500, detail="Payment system not configured")
        
        # Build webhook URL
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        # Initialize Stripe checkout
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        # Build success and cancel URLs from frontend origin
        origin = checkout_req.origin_url.rstrip('/')
        success_url = f"{origin}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin}/pricing"
        
        # Create checkout session request
        checkout_request = CheckoutSessionRequest(
            amount=float(package["amount"]),
            currency=package["currency"],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "user_email": current_user["email"],
                "user_id": current_user.get("id", ""),
                "package_id": checkout_req.package_id,
                "tier": package["tier"],
                "billing_period": package["billing_period"]
            }
        )
        
        # Create checkout session
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction in database
        db = request.app.state.db
        transaction = {
            "session_id": session.session_id,
            "user_email": current_user["email"],
            "user_id": current_user.get("id", ""),
            "package_id": checkout_req.package_id,
            "package_name": package["name"],
            "amount": package["amount"],
            "currency": package["currency"],
            "tier": package["tier"],
            "billing_period": package["billing_period"],
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        logger.info(f"Created checkout session {session.session_id} for user {current_user['email']}")
        
        return {
            "url": session.url,
            "session_id": session.session_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create checkout session: {str(e)}")


@router.get("/status/{session_id}")
async def get_payment_status(
    session_id: str,
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get the status of a payment session and update subscription if paid"""
    try:
        db = request.app.state.db
        
        # Find transaction
        transaction = await db.payment_transactions.find_one(
            {"session_id": session_id},
            {"_id": 0}
        )
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Verify user owns this transaction
        if transaction["user_email"] != current_user["email"]:
            raise HTTPException(status_code=403, detail="Unauthorized")
        
        # If already processed, return cached status
        if transaction["payment_status"] == "paid":
            return {
                "status": "complete",
                "payment_status": "paid",
                "message": "Payment already processed",
                "tier": transaction["tier"]
            }
        
        # Get Stripe API key
        stripe_api_key = os.environ.get("STRIPE_API_KEY")
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Payment system not configured")
        
        # Initialize Stripe and check status
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update transaction status
        new_status = checkout_status.payment_status
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "payment_status": new_status,
                    "stripe_status": checkout_status.status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }
            }
        )
        
        # If payment successful, upgrade user subscription
        if new_status == "paid":
            new_tier = transaction["tier"]
            
            # Update user's subscription tier
            await db.users.update_one(
                {"email": current_user["email"]},
                {
                    "$set": {
                        "subscription_tier": new_tier,
                        "subscription_updated_at": datetime.now(timezone.utc).isoformat(),
                        "subscription_package": transaction["package_id"]
                    }
                }
            )
            
            logger.info(f"Upgraded user {current_user['email']} to {new_tier} tier")
            
            return {
                "status": "complete",
                "payment_status": "paid",
                "message": f"Payment successful! You are now on the {new_tier.title()} plan.",
                "tier": new_tier
            }
        
        elif checkout_status.status == "expired":
            return {
                "status": "expired",
                "payment_status": new_status,
                "message": "Payment session expired. Please try again."
            }
        
        else:
            return {
                "status": "pending",
                "payment_status": new_status,
                "message": "Payment is being processed..."
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking payment status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check payment status: {str(e)}")


@router.get("/history")
async def get_payment_history(
    request: Request,
    current_user: dict = Depends(get_current_user)
):
    """Get user's payment history"""
    try:
        db = request.app.state.db
        
        transactions = await db.payment_transactions.find(
            {"user_email": current_user["email"]},
            {"_id": 0}
        ).sort("created_at", -1).to_list(100)
        
        return {"transactions": transactions}
        
    except Exception as e:
        logger.error(f"Error fetching payment history: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment history")
