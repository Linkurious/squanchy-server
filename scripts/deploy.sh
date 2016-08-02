aptitude install -y vim git npm htop tree
npm install -g n
n 4.4.4
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 4430

rm master.zip

mkdir data
mv dev-center-master dev-center
cd dev-center

./scripts/write_config.sh

npm install
npm start