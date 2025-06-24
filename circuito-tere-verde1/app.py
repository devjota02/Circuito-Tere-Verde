import os
from flask import Flask, render_template, jsonify, request, redirect, url_for, flash, session
from functools import wraps
from models import db, User, Trail, Event

# --- CONFIGURAÇÃO DA APLICAÇÃO ---
app = Flask(__name__)
# IMPORTANTE: Em um projeto real, essa chave deve ser um valor longo e aleatório, e não deve ser exposta no código.
app.config['SECRET_KEY'] = 'uma-chave-secreta-muito-forte-para-o-projeto-final'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

# --- DECORATOR PARA PROTEGER ROTAS ADMIN ---
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    return decorated_function

# --- COMANDO PARA INICIAR O BANCO DE DADOS ---
@app.cli.command('init-db')
def init_db_command():
    """Cria as tabelas e popula com dados iniciais."""
    with app.app_context():
        db.drop_all()
        db.create_all()
        admin_user = User(username='admin')
        admin_user.set_password('12345678')
        db.session.add(admin_user)
        trails_data = [
            Trail(name="Trilha do Sino", park="Parque Nacional da Serra dos Órgãos", difficulty="Difícil", duration="6-8 horas", distance="11 km (ida)", image="images/trilha-sino.jpg", description="Uma das trilhas mais famosas do Brasil.", biodiversity="Campos de Altitude, Orquídeas raras."),
            Trail(name="Trilha Cartão Postal", park="Parque Nacional da Serra dos Órgãos", difficulty="Fácil", duration="1 hora", distance="1.2 km", image="images/cartao-postal.jpg", description="Trilha suspensa e acessível.", biodiversity="Pica-paus, tucanos."),
        ]
        db.session.bulk_save_objects(trails_data)
        events_data = [
            Event(name="Observação de Aves Noturnas", date_str="Toda última sexta-feira do mês", location="PARNASO", description="Caminhada guiada para observação de corujas."),
        ]
        db.session.bulk_save_objects(events_data)
        db.session.commit()
        print('Banco de dados inicializado com sucesso!')

# --- API ENDPOINTS (Para o Front-End) ---
@app.route('/api/trails')
def get_trails():
    trails = Trail.query.all()
    return jsonify([{'id': t.id, 'name': t.name, 'park': t.park, 'difficulty': t.difficulty, 'image': url_for('static', filename=t.image)} for t in trails])

@app.route('/api/trail/<int:trail_id>')
def get_trail_details(trail_id):
    trail = Trail.query.get_or_404(trail_id)
    return jsonify({'id': trail.id, 'name': trail.name, 'park': trail.park, 'difficulty': trail.difficulty, 'duration': trail.duration, 'distance': trail.distance, 'address': trail.address, 'image': url_for('static', filename=trail.image), 'description': trail.description, 'biodiversity': trail.biodiversity})

@app.route('/api/events')
def get_events():
    events = Event.query.all()
    return jsonify([{'id': e.id, 'name': e.name, 'date_str': e.date_str, 'location': e.location, 'description': e.description} for e in events])

# --- ROTAS DO SITE PÚBLICO ---
@app.route('/')
def index():
    return render_template('index.html')

# --- ROTAS DO PAINEL ADMIN ---
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        user = User.query.filter_by(username=request.form['username']).first()
        if user and user.check_password(request.form['password']):
            session['user_id'] = user.id
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Usuário ou senha inválidos', 'danger')
    return render_template('admin_login.html')

@app.route('/admin/logout')
@login_required
def admin_logout():
    session.clear()
    return redirect(url_for('admin_login'))

@app.route('/admin/dashboard')
@login_required
def admin_dashboard():
    trails = Trail.query.order_by(Trail.name).all()
    events = Event.query.order_by(Event.name).all()
    return render_template('admin_dashboard.html', trails=trails, events=events)

# --- CRUD DE TRILHAS ---
@app.route('/admin/trail/add', methods=['POST'])
@login_required
def add_trail():
    new_trail = Trail(name=request.form['name'], park=request.form['park'], difficulty=request.form['difficulty'])
    db.session.add(new_trail)
    db.session.commit()
    flash('Nova trilha adicionada com sucesso!', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/trail/edit/<int:id>', methods=['POST'])
@login_required
def edit_trail(id):
    trail = Trail.query.get_or_404(id)
    trail.name = request.form['name']
    trail.park = request.form['park']
    trail.difficulty = request.form['difficulty']
    trail.duration = request.form['duration']
    trail.distance = request.form['distance']
    trail.description = request.form['description']
    trail.biodiversity = request.form['biodiversity']
    db.session.commit()
    flash(f'Trilha "{trail.name}" atualizada com sucesso!', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/trail/delete/<int:id>', methods=['POST'])
@login_required
def delete_trail(id):
    trail = Trail.query.get_or_404(id)
    db.session.delete(trail)
    db.session.commit()
    flash(f'Trilha "{trail.name}" removida com sucesso!', 'danger')
    return redirect(url_for('admin_dashboard'))

# --- CRUD DE EVENTOS ---
@app.route('/admin/event/add', methods=['POST'])
@login_required
def add_event():
    new_event = Event(name=request.form['name'], date_str=request.form['date_str'], location=request.form['location'], description=request.form['description'])
    db.session.add(new_event)
    db.session.commit()
    flash('Novo evento adicionado com sucesso!', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/event/edit/<int:id>', methods=['POST'])
@login_required
def edit_event(id):
    event = Event.query.get_or_404(id)
    event.name = request.form['name']
    event.date_str = request.form['date_str']
    event.location = request.form['location']
    event.description = request.form['description']
    db.session.commit()
    flash(f'Evento "{event.name}" atualizado com sucesso!', 'success')
    return redirect(url_for('admin_dashboard'))

@app.route('/admin/event/delete/<int:id>', methods=['POST'])
@login_required
def delete_event(id):
    event = Event.query.get_or_404(id)
    db.session.delete(event)
    db.session.commit()
    flash(f'Evento "{event.name}" removido com sucesso!', 'danger')
    return redirect(url_for('admin_dashboard'))

if __name__ == '__main__':
    app.run(debug=True)