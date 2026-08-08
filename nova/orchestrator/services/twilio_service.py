import os
from twilio.rest import Client

def send_whatsapp_sos(contact_name: str, to_number: str, account_sid: str, auth_token: str, from_number: str):
    """
    Sends a WhatsApp SOS message using the Twilio API.
    """
    try:
        client = Client(account_sid, auth_token)
        
        # Ensure the numbers have the 'whatsapp:' prefix
        if not to_number.startswith("whatsapp:"):
            to_number = f"whatsapp:{to_number}"
        if not from_number.startswith("whatsapp:"):
            from_number = f"whatsapp:{from_number}"
            
        message_body = f"🚨 *NOVA SOS ALERT* 🚨\n\nHi {contact_name}, your friend is currently experiencing a severe emotional spiral or panic attack in the Nova app and has requested emergency support.\n\nPlease check in on them gently."
        
        message = client.messages.create(
            from_=from_number,
            body=message_body,
            to=to_number
        )
        
        print(f"Twilio message sent successfully: {message.sid}")
        return True, message.sid
    except Exception as e:
        print(f"Failed to send Twilio message: {e}")
        return False, str(e)
