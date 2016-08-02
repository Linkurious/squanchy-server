aptitude install -y vim git npm htop tree screen
npm install -g n
n 4.4.4
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 4430

wget -O /usr/bin/certbot-auto https://dl.eff.org/certbot-auto
chmod a+x /usr/bin/certbot-auto