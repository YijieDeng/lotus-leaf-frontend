echo "UW Solar Data Frontend Server Configuation";

sudo apt-get update;

print_step () {
    echo "Step "$1": $2";
}

install_package() {
    print_step $1 "Install $2";
    if ! foobar_loc="$(type -p "$3")" || [[ -z $foobar_loc ]]; then
        sudo apt-get install $4;
    else
        echo "$3 has been installed";
    fi
}

echo "------------------------------"
echo "| Installing Requirements... |"
echo "------------------------------"

install_package 1 "NodeJS" "node" "nodejs"
# install_package 2 "PM2" "pm2"
install_package 2 "MySQL" "mysql" "mysql-server"

echo "Starting MySQL Service...."
sudo systemctl restart mysqld

echo "----------------------"
echo "| Configure Packages |"
echo "----------------------"
npm install
sudo npm install pm2 -g

echo "Requirement are installed"

echo "This script does not operate database. Please initialize it"
echo "manually by running:"
echo "mysql -u <username> -p"
echo "create database <name>"
echo "and then modify your config.js according to the documentation."


