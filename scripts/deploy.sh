aptitude install -y vim git npm htop tree
npm install -g n
n 4.4.4
iptables -t nat -A PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080
iptables -t nat -A PREROUTING -p tcp --dport 443 -j REDIRECT --to-port 4430

git clone https://github.com/Linkurious/dev-center.git

cd dev-center

read -p "Enter HTTP username: " username
read -s -p "Enter HTTP password: " password
echo
read -s -p "Confirm password: " confirm
echo

if [ $password != $confirm ] ; then
  echo -e "\e[91mPassword mismatch.\e[0m"
  exit 1
fi

SALT='sand-castle'

hash=`echo -n ${password}${SALT} | sha256sum | head -c 64`

echo Writing config.json...

echo "{\"user\":\"${username}\",\"password\":\"${hash}\",\"http_port\":8080,\"https_port\":4430,\"root\":\"/home/linkurious/data\"}" > config.json

npm install

mkdir data
npm start