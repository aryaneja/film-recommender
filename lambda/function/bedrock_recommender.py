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

    try:
        chat_response = chat_table.get_item(Key={'userId': user_id})
        chat_item = chat_response.get('Item', {})
        chat_history = chat_item.get('chatHistory', [])
    except Exception as e:
        print(f"Error fetching chat history for user {user_id}: {str(e)}")
        chat_history = []

    film_titles = [film['title'] for film in film_list if 'title' in film]                                               
    film_titles_str = ", ".join(film_titles) if film_titles else "No films in their list."                               
    
    full_prompt = f"""
Human: You are a film recommendation chatbot.

Here are some movies the user has already added to their list: {film_titles_str}.

Here is the current chat history between you and the user:
"""
    for turn in chat_history:
        full_prompt += f"Human: {turn['human']}\nAssistant: {turn['assistant']}\n"

    full_prompt += f"Human: {user_message}\nAssistant:"

    if "finalize" in user_message.lower():
        full_prompt = f"""
Human: Based on the previous conversation:
{full_prompt}, 
please provide me with a well explained list of 5 movie recommendations based on the previous conversation. Please only respond in a JSON array format.
        
Assistant:
"""

    else:
        full_prompt = f"""{full_prompt}"""

Assistant:"""

    bedrock_body = json.dumps({
        "prompt": prompt,
        "max_tokens_to_sample": 1000,
        "stop_sequences": ["\\\\n\\\\nHuman:"]
    })
    response = bedrock_runtime.invoke_model(
        
        modelId=MODEL_ID,
        body=body,
        contentType='application/json',
        accept='application/json'
    )

    response_body = json.loads(response['body'].read())                                                           
    completion_text = response_body.get('completion', '')

    if "finalize" in user_message.lower():
        try:
            recommendations = json.loads(completion_text)
        except json.JSONDecodeError as e:
            print(f"Error decoding JSON from bedrock: {e}")
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


