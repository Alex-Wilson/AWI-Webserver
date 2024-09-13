@Auhor: Alex Wilson
@Email: Alex.Wilson.0425@gmail.com
@Domain: AlexWilson.Info
@Purpose: Create a website which instills pride in its creator.

@Assumptions:
Basic knowledge of how to use Powershell, Windows 10/11, anytime you see $VARIABLE_NAME this should be substituted for the real variable name
            
@KYC Services Requiring Accounts:
Email, GitHub, Digital Ocean

# Creation

# Download Github CLI Tool [https://cli.github.com/]

# Configure Authentication for GitHub CLI Tool
- In PowerShell run the command: `gh auth login`. This will prompt a series of responses.

- `>GitHub.com`
- `>SSH`
- `Login with a web browser`

- A code will be generated in the terminal. Press enter to autoamtically be sent to the sign in page for GitHub. Paste the code, review the access requirements, and then close that page. 

# Generate SSH Keys

# Add SSH Keys to GitHub


# Git Repo Creation
- In Powershell run the command: `gh repo create AWI-Webserver --public --license gpl-3.0`
- This will have created a repository on the GitHub servers. This can be verified by going to to the `Github.com/$USER_NAME/$REPO_NAME` or by looking at the "Repositories" section at the `Github.com` home page when logged into the same account used for creation.  

# Change Directory and Clone
- In Powershell change to the directory to where you want to store the repositorry. It may look like `C:\Dev`. 
- In Powershell run the command: `git clone https://github.com/$USER_NAME/$REPO_NAME.git`.
- You should see a new folder labeled `$REPO_NAME`.
- Navigate into that folder
- Confirm this is a git project by running `git status`. We should see a message saying "working tree clean".

# Add Files
Now that we have a clean tree lets add two files. A `README.md` file which should contain information about this project. Then a `sever.js` file to test our server. Next, a `.gitignore` file which will be used to omit potentially sensetive information. Lastly, an `index.html` file which will be rendered to make sure our server is up and running.

- Ensure you are in the working directory
- `New-Item -Path "README.md" -ItemType "file"`
- `New-Item -Path "server.js" -ItemType "file"`
- `New-Item -Path ".gitignore" -ItemType "file"`
- `New-Item -Path "index.html" -ItemType "file"`
- Check the contents of the directory to confirm these files were created.

# Create Landing HTML Page
- `code index.html`
- Add a landing page


# Initialize Node Package Manager and Install Express
- `npm init`
- `npm install express`

# Update gitignore file
`code .gitignore`
- Type `node_modules`
- Type `.env`
- Save the file




# Purchase a Domain Name
NameCheap, GoDaddy, SquareSpace, HostGator. Choose a name that is topical and short.Avoid cringe extensions like .biz or .kp
Create an account
Register a payment method
Purchase the desired domain name

# Purchase a VPS
Create Digital Ocean account
Register a payment method
On DO you wont pay if you dont have a server spinning


# Initial VPS Configuration


# Setup SSH Keys for VPS

# SSH into VPS



# Update and Upgrade
sudo apt-get update
sudo apt-get upgrade
sudo apt-get dist-upgrade
sudo apt-get autoremove
sudo apt-get clean

# Firewalls








# Setup HTTPS

# Harden VPS


# Clone Repo into Production Server