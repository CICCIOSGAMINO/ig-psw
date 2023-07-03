ig-psw - Puppeteer Auth Bot
===========================
[TOC]

Run puppeteer on Instagram https://www.instagram.com/accounts/login/ to try to log in with, username and password. The username is set in the code of index.mjs, password are loaded from psw.lst text file and in the file cache.json is saved the count of the password read in the file psw.lst already tested.

So if you want to start from the first line of the file psw.lst you need count: 0 in cache.json

```json
{
    "count": 0
}
```

If you have a number greater then 0 the bot will start trying password from that position:

```json
{
    "count": 7790
}
```

# Install Node.js, Npm, Tor on Linux
Install latest version of Node.js, Npm from source code (compiling need lot of time)

```bash
#!/bin/bash
wget https://nodejs.org/download/release/v20.3.0/node-v20.3.1.tar.gz

tar -xvzf node-v20.3.1.tar.gz
cd node-v20.3.1

# configure
./configure

# make and compile the code
# -j run make in multithread mode nproc tell number of
# available CPU cores
make -j$(nproc)

# make install 
sudo make install

# check the version
node --version
npm --version
```

Install Tor from Linux repo

```bash
sudo apt update
sudo apt upgrade

sudo apt install tor

# check the version
tor --version
```

Install Git from Linux repo

```bash
sudo apt update
sudo apt upgrade

sudo apt install git

git --version
```

Clone to code from github repo

```bash
git clone https://github.com/CICCIOSGAMINO/ig-psw
```

# Run the index.mjs
To run this bot you need:

- Node.js >= 18
- Tor   (Active on 9050)

Run the nodejs instragram bot:

```bash
# start tor
sudo systemctl restart tor

# run nodejs bot
node index.mjs
```