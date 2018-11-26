# ndn-ledger

This repository contains proof of concept code for Operant Solar's Distributed Ledger over Named Data Networking (NDN) project.

### People

Vishrant Vasavada, MS, UCLA

Zhiyi Zhang, PhD, UCLA

Randy King, CEO, Operant Solar

Lixia Zhang, Professor, UCLA

### Structure
ndn-ledger module has two major components.
- ledger: This is where essentially all Tangle related code lives
- ndn-js: A light JavaScript NDN library that provides all NDN consumer and producer functionalities

### Installation

Note: The following installation instructions are only for linux/ubuntu users. We still haven't tried running the code in other environments.

### Virtual Machine
For a Mac, use virtualbox following these instructions

https://www.simplehelp.net/2015/06/09/how-to-install-ubuntu-on-your-mac/

Installed Ubuntu 18.04.1
- Minimal installation, Yes
- Download updates, Yes
- Install third part, Yes
- Erase disk

I was asked whether to install availabe updates, I said 'yes'

### Install Curl
Open System settings > Software & Updates > Ubuntu Software > make sure you have all the source selected (main, universe, restricted, and multiverse) and select download from Main server.

Now try sudo apt-get update && sudo apt-get install curl

I installed v7.58.0

##### Prerequisites

You need to install following packages/softwares to before checking out the code and get it running.

- Node.js v6+ (https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)

    - WARNING: node.js v11.1.0 doesn't work with 'level' node module
    - v10.x works ok

    curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
    sudo apt-get install -y nodejs


- Named Data Networking Forwarding Daemon v0.6.4 (https://named-data.net/doc/NFD/current/INSTALL.html)

    - Had to enable the PPA source code in the 'Other Software' tab of Ubuntu before package installer would load prerequisities
    - sudo add-apt-repository ppa:named-data/ppa
    - sudo apt-get update
    - sudo apt-get install nfd

##### Install git

- sudo apt install git

##### Install Python Tools and required packages

- sudo apt install pip
- sudo apt install python-tk
- pip install networkx
- pip install matplotlib

##### Installing ndn-ledger

Install required node modules

I had to explicitly add: 'level' and 'multilevel'   Other requirements are built in node modules now

npm install level
npm install multilevel

Checkout the code from this repository and install

```sh
$ git clone https://github.com/vvasavada/ndn-ledger.git
$ cd ndn-ledger
$ npm install
```

### Doing it all over again for a second node

I had some problems with cloning the VM.  So I did a clean install of a second VM.  I had to manually change the name of the computer to something diferent...when I accepted the default, it crashed my computer..not sure why

### Getting Started

After required node modules have been installed, code should be ready for running. A node requires running two processes: LevelDB Server and Repository. Repository processes requires LevelDB server and NFD process to be up and running before they start. Follow these steps to get everything up and running.

Start NFD process

```sh
$ nfd-start
```

In different window, start LevelDB server. This will create `database` folder inside the directory. Note that if `database` folder already existed previously, running db-server will just get linked to it without creating new `database`. This means that everytime you want to start testing afresh, you'll need to manually delete this `database` folder.

```sh
$ cd ndn-ledger/ledger/storage
$ node db-server.js
```

In another window, start repository process

```sh
$ cd ndn-ledger/ndn-js/app
$ node repository.js
```


##### Configuring NFDs

Once you have another VM clone up (let us call them vm1 and vm2 where vm2 is cloned copy) and running, please follow the following steps:

1) Change hostname in vm2 and reboot: You need to do this so that they both don't use same prefix. In vm2, open terminal. Run `sudo vi /etc/hostname` and `sudo vi /etc/hosts` and change hostname to some different name (so now, vm1 and vm2 have different hostnames). Reboot vm2.

VM1: randyking-VirtualBox
VM2: randyking-VirtualBox2

2) Enable network adapters: 

- Click on vm1 and power it off
- Inside VirtualBox Manager, go to File | Host Network Manager | Create to make a Host Network Adapter. 
- Click on Settings in top bar. In the left column, you should see 'Network'. Click on that. 
- Go to adapter 2. Click "Enable Network Adapter". Attached to should be set to 'Host-only Adapter' and name will be something like vboxnet0. 
- Do similar for vm2, you need to create a different named adapter, vboxnet1 for instance, for the second node.

3 ) Now boot into vm1. Go to terminal and type ifconfig. You may have to add the ifconfig command by 'sudo apt install net-tools'; You should be able to see one of the interfaces having inet address of the form 192.168.x.x.  That is the public IP. Similarly, lookup for vm2. Let us call them ip1 and ip2 for vm1 and vm 2 respectively.  These may change every time you reboot.

VM1: 192.168.56.255
VM2: 192.168.57.255

4) Adding face and routes to NFD: In vm1, run `nfdc face create udp://<ip2>`. This adds a face to connect to vm2. Now you add a multicast route and route to reach vm2. So run `nfdc route add /ledger udp://<ip2>` and `nfdc route add /ledger/<hostname of vm2> udp://<ip2>`. You need to set strategy of /ledger prefix to multicast. So do `nfdc strategy set /localhost/nfd/strategy/multicast/%FD%03`. 

5) Repeat the above NFD configurations for vm2. Replace <ip2> with <ip1> and <hostname of vm2> with <hostname of vm1>. You should now be able to send notifs and exchange blocks between two nodes.

Below we give an example of how to configure NFDs at the nodes. Assume that you have two nodes with NFDs running and node1 and node2 are their hostnames and 192.168.56.101 and 192.168.56.102 are their IPs respectively.
At this point, your node is up and running -- ready to serve and receive blocks!

This node will generate a block whenever it receives energy request from another node. To send energy request, please issue following command.

```sh
$ cd ndn-ledger/ndn-js/app
$ node client.js REQ <prefix-of-node-requesting-from>
```
##### Configuring NFDs

Once you start nfd using ```nfd-start```, you can simply run nfd-configure script in utils directory.

Assume that you have two nodes with NFDs running and node1 and node2 are their hostnames and 192.168.56.101 and 192.168.56.102 are their IPs respectively.

At node1:

```sh
$ nfdc face create udp://192.168.57.255
$ nfdc route add /ledger udp://192.168.57.255
$ nfdc route add /ledger/randyking-VirtualBox2 udp://192.168.57.255
$ nfdc strategy set /ledger /localhost/nfd/strategy/multicast/%FD%03
$ nfdc strategy set /ledger/randyking-VirtualBox2 /localhost/nfd/strategy/best-route/%FD%05
$ cd ndn-ledger/utils
$ ./nfd-configure udp://192.168.56.102 /node2
```

At node 2:

```sh
$ nfdc face create udp://192.168.56.255
$ nfdc route add /ledger udp://192.168.56.255
$ nfdc route add /ledger/randyking-VirtualBox udp://192.168.56.255
$ nfdc strategy set /ledger /localhost/nfd/strategy/multicast/%FD%03
$ nfdc strategy set /ledger/randyking-VirtualBox /localhost/nfd/strategy/best-route/%FD%05
$ cd ndn-ledger/utils
$ ./nfd-configure udp://192.168.56.101 /node1
```

If there are more nodes, you'll do same for each of their IP and routable prefix.


##### Running the Client

At this point, your node is up and running -- ready to serve and receive blocks!

If you want this node to generate a new block and notify other nodes, you'll have to use Client process. This will generate a new block, attach it to local Tangle and notify other nodes about it.

```sh
$ cd ndn-ledger/ndn-js/app
$ node client.js NOTIF
```
### Visualizing Results

To visualize tangle and generate result table, issue the following command

```sh
$ cd ndn-ledger/utils
$ node show-results.js
```

You should be able to see tangle image. `table.csv` file in utils folder contains the result table.
