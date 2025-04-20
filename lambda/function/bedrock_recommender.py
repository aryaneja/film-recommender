import json
import boto3
import os

bedrock_runtime = boto3.client(service_name='bedrock-runtime')
dynamodb = boto3.resource('dynamodb')
chat_table_name = os.environ.get('CHAT_TABLE_NAME')
chat_table = dynamodb.Table(chat_table_name)
MODEL_ID = 'anthropic.claude-v2'

def lambda_handler(event, context):
    user_id = event['requestContext']['authorizer']['claims']['email']
    body = json.loads(event['body'])
    user_message = body.get('userMessage', '')
    film_list = body.get('filmList', [])

    # Get past chat history
    try:
        chat_response = chat_table.get_item(Key={'userId': user_id})
        chat_item = chat_response.get('Item', {})
        chat_history = chat_item.get('chatHistory', [])
    except Exception as e:
        print(f"Error fetching chat history for user {user_id}: {str(e)}")
        chat_history = []

    # Build user film string
    film_titles = [film['title'] for film in film_list if 'title' in film]
    film_titles_str = ", ".join(film_titles) if film_titles else "No films in their list."

    # Base prompt with tone instruction
    base_prompt = f"""
You are a film recommendation chatbot. Be casual, brief, and include emojis in your responses — like you're chatting with a friend.

Here are some movies the user has already added to their list: {film_titles_str}.

Here is the current chat history between you and the user:
"""
    for turn in chat_history:
        base_prompt += f"Human: {turn['human']}\nAssistant: {turn['assistant']}\n"

    base_prompt += f"Human: {user_message}\nAssistant:"

    # Final prompt depending on whether it's a finalize request
    if "finalize" in user_message.lower():
        full_prompt = f"""\n\nHuman: Based on the previous conversation:

{base_prompt}

Please provide me with a well explained list of 5 movie recommendations based on the previous conversation. Please only respond in a JSON array format and do not include any extra text.

Assistant:"""
    else:
        full_prompt = f"""\n\n{base_prompt}"""

    # Prepare Bedrock call
    bedrock_body = json.dumps({
        "prompt": full_prompt,
        "max_tokens_to_sample": 1000,
        "stop_sequences": ["\n\nHuman:"]
    })

    response = bedrock_runtime.invoke_model(
        modelId=MODEL_ID,
        body=bedrock_body,
        contentType='application/json',
        accept='application/json'
    )

    response_body = json.loads(response['body'].read())
    completion_text = response_body.get('completion', '')

    if "finalize" in user_message.lower():
        try:
            recommendations = json.loads(completion_text)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from Bedrock: {e}")
            recommendations = []
        return {
            'statusCode': 200,
            'body': json.dumps(recommendations)
        }
    else:
        chat_history.append({'human': user_message, 'assistant': completion_text})
        chat_table.put_item(Item={
            'userId': user_id,
            'chatHistory': chat_history
        })
        return {
            'statusCode': 200,
            'body': json.dumps(completion_text)
        }
