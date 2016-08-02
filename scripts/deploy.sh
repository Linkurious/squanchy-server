git clone https://github.com/Linkurious/dev-center.git

mkdir data
cd dev-center

npm install

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