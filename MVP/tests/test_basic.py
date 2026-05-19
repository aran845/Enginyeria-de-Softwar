"""
Tests bàsics de Subly.
No necessiten base de dades per funcionar.
"""


def test_suma_basica():
    """Comprovacio previa de que Python funciona."""
    assert 1 + 1 == 2


def test_imports_del_projecte():
    """Comprova que els mòduls del projecte es poden importar."""
    import sys
    import os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

    #Si podem fer l'import sense errors, el test passa
    try:
        import flask 
        import flask_jwt_extended
        assert True
    except ImportError as e:
        assert False, f"No s'ha pogut importar: {e}"


def test_configuracio_jwt():
    """Comprova que la configuració bàsica de Flask funciona."""
    from flask import Flask
    from flask_jwt_extended import JWTManager

    app = Flask(__name__)
    app.config["JWT_SECRET_KEY"] = "test-secret"
    JWTManager(app)

    assert app.config["JWT_SECRET_KEY"] == "test-secret"
