#aptitude install -y vim git npm htop tree
#npm install -g n
#n 4.4.4
#iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
#iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 4430

#mkdir data
#cd dev-center

SALT='sand-castle'

read -p "Enter HTTP username: " username
read -s -p "Enter HTTP password: " password

hash=`echo {$password}${SALT} | sha256sum`

# write config

echo "{\"user\":\"${username}\",\"password\":\"${hash}\",\"http_port\":8080,\"https_port\":4430,\"root\":\"/home/linkurious/data\"}"

#npm install
#npm start