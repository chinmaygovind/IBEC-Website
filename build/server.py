import os
from flask import Flask, send_from_directory, abort
from api import api_bp

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(__name__, static_folder=BASE_DIR, static_url_path='')
app.register_blueprint(api_bp, url_prefix='/api')


@app.route('/')
def index():
    return send_from_directory(BASE_DIR, 'index.html')


@app.before_request
def block_source_files():
    """Prevent serving Python source or hidden files."""
    from flask import request
    path = request.path
    if path.endswith('.py') or path.endswith('.pyc') or '/__' in path:
        abort(404)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    debug = os.environ.get('FLASK_DEBUG', '0') == '1'
    print(f'Serving from {BASE_DIR}')
    print(f'http://localhost:{port}/portfolio.html')
    app.run(host='0.0.0.0', port=port, debug=debug)
