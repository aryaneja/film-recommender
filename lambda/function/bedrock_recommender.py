import json
import boto3
import os
import hashlib

bedrock_runtime = boto3.client(service_name='bedrock-runtime')
dynamodb = boto3.resource('dynamodb')

chat_table_name = os.environ.get('CHAT_TABLE_NAME') or 'BedrockRecommendations'
chat_table = dynamodb.Table(chat_table_name)
MODEL_ID = 'anthropic.claude-v2'

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

    # Generate numeric movieId from user email
    movie_id = int(hashlib.sha256(user_id.encode()).hexdigest(), 16) % (10**12)

    # Get chat history from DynamoDB
    try:
        chat_response = chat_table.get_item(Key={'movieId': movie_id})
        chat_item = chat_response.get('Item', {})
        chat_history = chat_item.get('chatHistory', [])
    except Exception as e:
        print(f"Error fetching chat history for user {user_id}: {str(e)}")
        chat_history = []

    film_titles = [film['title'] for film in film_list if 'title' in film]
    film_titles_str = ", ".join(film_titles) if film_titles else "No films in their list."

    system_prompt = (
        "You are a film recommendation chatbot. Be casual and conversational — like you're chatting with a friend. Your answer should have two parts. The first should be a brief comment on the user's inputs, whether it is a positive comment on their film choices and/or answer to your question. The second part should be the film recommendations that builds on your knowledge of the user inputs. Always recommend the user a minimum of 5 films and always end with a question for the user to know more about their taste in film. The recommended films should be presented as an ordered list with breaks between each film. "
    )

    conversation_history = f"\n\nHuman: Here are some movies the user has already added to their list: {film_titles_str}.\n"
    for turn in chat_history:
        conversation_history += f"Human: {turn['human']}\nAssistant: {turn['assistant']}\n"
    conversation_history += f"Human: {user_message}\nAssistant:"

    if "finalize" in user_message.lower():
        # Stronger prompt: require TMDB id, title, and reason
        full_prompt = (
            f"\n\nHuman: {system_prompt}\n"
            f"Based on the previous conversation:\n{conversation_history}\n"
            f"Please provide a JSON array of 5 film recommendations. Each object must have: id (TMDB movie id), title, and a brief reason. Use emojis only. No extra text.\n\nAssistant:"
        )
    else:
        full_prompt = f"\n\nHuman: {system_prompt}\n{conversation_history}"

    bedrock_body = json.dumps({
        "prompt": full_prompt,
        "max_tokens_to_sample": 1000,
        "stop_sequences": ["\n\nHuman:"]
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
        completion_text = response_body.get('completion', '')

    except Exception as e:
        print("Error calling Claude or parsing response:", str(e))
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': 'Claude model error'})
        }

    if "finalize" in user_message.lower():
        try:
            recommendations = json.loads(completion_text)
            # Validate recommendations: must be a list of dicts with 'id' and 'title'
            if not (isinstance(recommendations, list) and all(isinstance(f, dict) and 'id' in f and 'title' in f for f in recommendations)):
                raise ValueError("Recommendations must be a list of objects with 'id' and 'title'.")
        except Exception as e:
            print("Error decoding or validating JSON from Claude:", e)
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Model did not return valid recommendations. Please try again.'})
            }
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(recommendations)
        }
    else:
        chat_table.put_item(Item={
            'movieId': movie_id,
            'userId': user_id,
            'chatHistory': chat_history + [{'human': user_message, 'assistant': completion_text}]
        })
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps(completion_text)
        }
