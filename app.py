from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from datetime import timedelta
from dotenv import load_dotenv
import os

# ✅ Load Gemini SDK
import google.generativeai as genai

# 🔐 Load API Key from .env
load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

# 🚀 Flask Setup
app = Flask(__name__)
app.secret_key = "supersecretkey"
app.permanent_session_lifetime = timedelta(minutes=30)

# 🧑 Dummy User Store (In-memory)
users = {
    "demo@example.com": "1234"
}

# 🤖 Chat Endpoint using Gemini
@app.route("/api/chat", methods=["POST"])
def chat_api():
    data = request.json
    user_input = data.get("message", "").strip()

    if not user_input:
        return jsonify({"response": "⚠️ Please enter a valid message."}), 400

    try:
        # 🔧 Default model for NeoMind AI
        model = genai.GenerativeModel("gemini-2.5-flash")

        response = model.generate_content(user_input)
        return jsonify({"response": response.text.strip()})

    except Exception as e:
        print("🚨 [NeoMind AI Error]:", e)
        return jsonify({"response": "❌ Oops! Something went wrong with NeoMind AI."}), 500


# 🌐 Web Routes
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/signup', methods=['GET', 'POST'])
def signup():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if email in users:
            flash("User already exists. Please login.", "error")
            return redirect(url_for('login'))
        users[email] = password
        flash("Signup successful. Please login.", "success")
        return redirect(url_for('login'))
    return render_template('signup.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        if email in users and users[email] == password:
            session.permanent = True
            session['user'] = email
            flash("Logged in successfully.", "success")
            return redirect(url_for('chat'))
        flash("Invalid credentials.", "error")
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.pop('user', None)
    flash("Logged out successfully.", "info")
    return redirect(url_for('home'))

@app.route('/chat')
def chat():
    if 'user' not in session:
        flash("Please login to access chat.", "warning")
        return redirect(url_for('login'))
    return render_template('index.html')


# 🟢 Run the NeoMind AI App
if __name__ == '__main__':
    app.run(debug=True)
