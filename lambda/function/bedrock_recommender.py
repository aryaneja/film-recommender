import json
import boto3
import os
import hashlib

bedrock_runtime = boto3.client(service_name='bedrock-runtime')

MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0'

def lambda_handler(event, context):
    # Fallback-safe user ID (if no Cognito)
    try:
        user_id = event['requestContext']['authorizer']['claims']['email']
    except (KeyError, TypeError):
        print("No authenticated user — using fallback email.")
        user_id = "demo@example.com"

    body = json.loads(event['body'])
    user_message = body.get('userMessage', '')
    film_list = body.get('filmList', [])
    chat_history = body.get('chatHistory', [])

    # Generate numeric movieId from user email
    movie_id = int(hashlib.sha256(user_id.encode()).hexdigest(), 16) % (10**12)

    film_titles = [film['title'] for film in film_list if 'title' in film]
    film_titles_str = ", ".join(film_titles) if film_titles else "No films in their list."

    system_prompt = (
        "You are a film recommendation chatbot. Be casual and conversational — like you're chatting with a friend. "
        "Your answer should have two parts. The first should be a brief comment on the user's inputs, whether it is "
        "a positive comment on their film choices and/or answer to your question. The second part should be the film "
        "recommendations that builds on your knowledge of the user inputs. Always recommend the user a minimum of 5 films "
        "and always end with a question for the user to know more about their taste in film. The recommended films should "
        "be presented as an ordered list with breaks between each film."
    )

    # Build messages array for Claude 3 Messages API
    messages = []

    # Add context about user's film list as first user message
    context_message = f"Here are some movies the user has already added to their list: {film_titles_str}."

    # Add previous chat history
    for turn in chat_history:
        messages.append({"role": "user", "content": turn['human']})
        if turn['assistant']:
            messages.append({"role": "assistant", "content": turn['assistant']})

    # Add current user message (include context if this is the first message)
    if not chat_history:
        current_message = f"{context_message}\n\n{user_message}"
    else:
        current_message = user_message

    messages.append({"role": "user", "content": current_message})

    bedrock_body = json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 1000,
        "system": system_prompt,
        "messages": messages
    })

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    try:
        response = bedrock_runtime.invoke_model(
            modelId=MODEL_ID,
            body=bedrock_body,
            contentType='application/json',
            accept='application/json'
        )

        raw_body = response['body'].read()
        print("Raw Claude response:", raw_body)
        response_body = json.loads(raw_body)

        # Claude 3 Messages API returns content as an array
        completion_text = ""
        if 'content' in response_body and len(response_body['content']) > 0:
            completion_text = response_body['content'][0].get('text', '')

    except Exception as e:
        print("Error calling Claude or parsing response:", str(e))
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Claude model error'})
        }

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps(completion_text)
    }
