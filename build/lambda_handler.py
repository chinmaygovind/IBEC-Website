from apig_wsgi import make_lambda_handler
from server import app

_wsgi_handler = make_lambda_handler(app)


def handler(event, context):
    # CloudWatch keep-warm ping — don't run through Flask
    if event.get('source') == 'aws.events':
        return {'statusCode': 200, 'body': 'warm'}
    return _wsgi_handler(event, context)
