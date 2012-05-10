```bash
git clone git@github.com:McLeopold/PL101.git
cd PL101
git clone -b gh-pages git@github.com:McLeopold/PL101.git deploy
git submodule init
git submodule update
npm install
npm -g install jake
npm -g install mocha
jake
```