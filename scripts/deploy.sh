aptitude install -y vim git npm htop tree
npm install -g n
n 4.4.4
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 4430

git clone https://github.com/Linkurious/dev-center.git

mkdir data
cd dev-center

npm install