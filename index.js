import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import axios from 'axios';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 3000;
const SECRET_KEY = process.env.SECRET_KEY || "super-secret-pokemon-key";

app.use(cors());

// Middleware
app.use(express.static('dist')); // Serve Vite build
app.use(express.static('public')); // Fallback for any separate public assets if needed
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ... (Ping endpoint) ...

// SPA Fallback (Put this LAST, after all API routes)

// Simple Ping Endpoint for Keep-Alive
app.get('/api/ping', (req, res) => {
  res.send('PONG');
});

// Email Configuration (Ethereal)
let transporter;

async function createTestAccount() {
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
}

async function sendEmail(to, subject, text, html) {
  if (!transporter) return;
  
  const info = await transporter.sendMail({
    from: '"Pokemon Trainer" <ash@pokedex.com>', // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: text, // plain text body
    html: html, // html body
  });

  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
}

// Auth Routes

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const verificationToken = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || "Pokemon Trainer",
        verificationToken
      }
    });

    // Send Verification Email
    const verificationLink = `http://localhost:3000/api/verify-email?token=${verificationToken}`;
    await sendEmail(email, "Verify your Pokemon Account", 
      `Click here to verify: ${verificationLink}`,
      `<p>Welcome Trainer!</p><p>Please <a href="${verificationLink}">click here</a> to verify your account.</p>`
    );

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: "Signup successful. Verification email sent!", token, user: { id: user.id, email: user.email, name: user.name } });

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user.id }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ message: "Login successful", token, user: { id: user.id, email: user.email, name: user.name } });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify Email Endpoint
app.get('/api/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("Invalid token");
  }

  try {
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user) {
      return res.status(400).send("Invalid or expired token");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null }
    });

    res.send("<h1>Email Verified!</h1><p>You can now close this tab and login.</p>"); // Simple response
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).send("Internal server error");
  }
});

// Forgot Password Endpoint
app.post('/api/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
      return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Security: Don't reveal if user exists
      return res.json({ message: "If that email exists, we sent a reset link." });
    }

    const resetToken = uuidv4();
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry: expiry }
    });

    const resetLink = `http://localhost:3000/auth.html?resetToken=${resetToken}`; // Direct to frontend handling
    await sendEmail(email, "Reset your Password", 
      `Click here to reset: ${resetLink}`,
      `<p>Forgot your password?</p><p><a href="${resetLink}">Click here</a> to reset it.</p>`
    );

    res.json({ message: "If that email exists, we sent a reset link." });

  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset Password Endpoint
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: "Token and new password required" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() } // Not expired
      }
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword, resetToken: null, resetTokenExpiry: null }
    });

    res.json({ message: "Password reset successful" });

  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Teams API
app.get('/api/teams', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const teams = await prisma.savedTeam.findMany({ 
        where: { user_id: decoded.userId },
        orderBy: { updatedAt: 'desc' }
    });
    res.json(teams);
  } catch (error) {
    console.error("Fetch teams error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
});

app.post('/api/teams', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const { name, team_data } = req.body;
    
    const team = await prisma.savedTeam.create({
      data: {
        name,
        team_data, // Prisma handles Json type automatically
        user_id: decoded.userId
      }
    });
    res.json(team);
  } catch (error) {
    console.error("Save team error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.delete('/api/teams/:id', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { id } = req.params;
        
        // Verify ownership
        const team = await prisma.savedTeam.findUnique({ where: { id } });
        if (!team || team.user_id !== decoded.userId) {
            return res.status(403).json({ error: "Forbidden" });
        }

        await prisma.savedTeam.delete({ where: { id } });
        res.json({ message: "Team deleted" });
    } catch (error) {
        res.status(500).json({ error: "Internal server error" });
    }
});

// Battle History API
app.get('/api/battles', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const history = await prisma.battleHistory.findMany({
            where: { user_id: decoded.userId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(history);
    } catch (error) {
        res.status(401).json({ error: "Invalid token" });
    }
});

app.post('/api/battles', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { opponent_type, player_team, opponent_team, battle_log, result } = req.body;

        const battle = await prisma.battleHistory.create({
            data: {
                user_id: decoded.userId,
                opponent_type,
                player_team,
                opponent_team,
                battle_log,
                result
            }
        });
        res.json(battle);
    } catch (error) {
        console.error("Save battle error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// SPA Fallback
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: "API endpoint not found" });
  }
  // If it's auth.html, serve it (should be covered by static 'dist' but explicit check doesn't hurt)
  if (req.path === '/auth.html') {
      return res.sendFile(path.join(__dirname, 'dist', 'auth.html'));
  }
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

createTestAccount().then(() => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    // ... keep alive logic ...
  });
});
