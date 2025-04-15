import os
import boto3
import json

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('FILM_TABLE_NAME')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    http_method = event.get('httpMethod')
    user_id = event['requestContext']['authorizer']['claims']['sub']

    if http_method == 'POST':
        # Save film list
        body = json.loads(event['body'])
        film_list = body.get('filmList', [])
        table.put_item(Item={
            'userId': user_id,
            'filmList': film_list
        })
        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Film list saved successfully'})
        }

    elif http_method == 'GET':
        # Retrieve film list
        response = table.get_item(Key={'userId': user_id})
        item = response.get('Item', {})
        return {
            'statusCode': 200,
            'body': json.dumps({'filmList': item.get('filmList', [])})
        }

    return {
        'statusCode': 400,
        'body': json.dumps({'message': 'Unsupported HTTP method'})
    }