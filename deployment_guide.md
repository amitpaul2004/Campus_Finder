# Full Deployment Guide: Local to Live Cloud

Deploying a Full-Stack application (Frontend + Backend + Database) requires moving all three pieces from your personal laptop to the cloud. You MUST do this in a specific order:
1. **The Database (MongoDB Atlas):** Moves your data to the cloud.
2. **The Backend (Render):** Moves your server to the cloud and connects it to the cloud database.
3. **The Frontend (Vercel):** Moves your HTML/JS to the cloud and tells it to talk to the new cloud server instead of \`localhost\`.

---

## Step 1: Set Up MongoDB Atlas (The Cloud Database)
Right now, your app saves data to \`mongodb://localhost:27017\`. This only exists on your computer. We need a permanent database on the internet.

1. Go to **[MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)** and create a free account.
2. Click **Build a Database** and select the **M0 Free Tier** (AWS Mumbai is fine).
3. **Crucial Security Step:** It will ask you to create a "Database User".
   - **Username:** `admin` (or whatever you want)
   - **Password:** `your_password_here` (Write this down! You will need it in 2 minutes.)
   - Click **Create User**.
4. **Crucial Network Step:** It will ask "Where would you like to connect from?"
   - Choose **My Local Environment**.
   - In the IP Address box, type `0.0.0.0/0` (This means "Allow access from anywhere"). Render changes IP addresses constantly, so this ensures Render is never blocked.
   - Click **Add Entry**.
5. Once your Cluster is built, click the **Connect** button next to your cluster name.
6. Click **Drivers** (Node.js).
7. Copy the Connection String provided. It will look like this:
   `mongodb+srv://admin:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`
8. In a notepad, paste that string and **replace `<password>` with the real password you created in step 3**.
   *(Keep this string handy on your clipboard!)*

---

## Step 2: Deploy the Backend to Render (The Cloud Server)
Now we move your Node.js code to Render and give it the MongoDB string so it can talk to the database.

1. Go to **[Render.com](https://render.com/)** and create a free account.
2. Click **New +** and select **Web Service**.
3. Connect your GitHub account and select your `uniback` repository.
4. Fill out the settings:
   - **Name:** `uniback-api`
   - **Root Directory:** `Backend` *(Case sensitive!)*
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Scroll down to **Environment Variables** and add three keys:
   - Key: `MONGO_URI` | Value: `[Paste your big mongodb+srv string from your notepad here]`
   - Key: `EMAIL_USER` | Value: `[Your Gmail address]`
   - Key: `EMAIL_PASS` | Value: `[Your 16-letter App Password]`
6. Click **Create Web Service**.
7. Wait ~2 minutes. Once it says "Live", copy the public URL near the top (e.g., `https://uniback-api.onrender.com`).

---

## Step 3: Update Your Frontend Code (Telling JS where the Server is)
Your frontend Javascript currently hardcodes `http://localhost:5000`. If you publish it like this, it will try to find a server on the visitor's phone, which will fail!

1. Open your code editor (VS Code).
2. Do a **Global Search** across your entire `main` folder for:
   `http://localhost:5000`
3. Replace **every single instance** of `http://localhost:5000` with the live Render URL you just copied:
   `https://uniback-api.onrender.com`
   *(Careful: Do NOT add a slash at the end of the URL. Replace exactly `http://localhost:5000` with `https://uniback-api.onrender.com`)*
4. Open your terminal and **push these changes to GitHub**:
   \`\`\`bash
   git add .
   git commit -m "Updated localhost to Render URL"
   git push origin main
   \`\`\`

---

## Step 4: Deploy the Frontend to Vercel (The Live HTML Website)
Finally, we host the updated HTML/JS files so anyone can use the app.

1. Go to **[Vercel.com](https://vercel.com/)** and log in with GitHub.
2. Click **Add New** > **Project** and import your `uniback` repository.
3. **CRUCIAL:** Before clicking Deploy, look for the **Root Directory** setting. 
   - Click `Edit` and select your `main` folder. (This tells Vercel where your `index.html` lives).
4. Click **Deploy**.
5. Wait ~30 seconds. Vercel will give you a live link (e.g., `https://uniback-main.vercel.app`).

### You are done! 🎉
You can now open that Vercel link on your phone. When you report a lost item on Vercel, it securely messages your Render backend, which permanently saves it into your MongoDB Atlas cloud!
