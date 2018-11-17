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
- Minimal System, Yes
- Download updates, Yes
- Install third part, Yes
- Erase disk

I was asked whether to install availabe updates, I said 'yes'

### Install Curl
Open System settings > Software & Updates > Ubuntu Software > make sure you have all the source selected (main, universe, restricted, and multiverse) and select download from Main server.

Now try sudo apt-get update && sudo apt-get install curl

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

##### Installing ndn-ledger

Checkout the code from this repository and install required node modules

I had to explicitly add: 'level' and 'multilevel'   Other requirements are built in node modules now

npm install level
npm install multilevel


```sh
$ git clone https://github.com/vvasavada/ndn-ledger.git
$ cd ndn-ledger
$ npm install
```

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

At this point, your node is up and running -- ready to serve and receive blocks!

If you want this node to generate a new block and notify other nodes, you'll have to use Client process. This will generate a new block, attach it to local Tangle and notify other nodes about it.

```sh
$ cd ndn-ledger/ndn-js/app
$ node client.js NOTIF
```
##### Configuring NFDs

Below we give an example of how to configure NFDs at the nodes. Assume that you have two nodes with NFDs running and node1 and node2 are their hostnames and 192.168.56.101 and 192.168.56.102 are their IPs respectively.

At node1:

```sh
$ nfdc face create udp://192.168.56.102
$ nfdc route add /ledger udp://192.168.56.102
$ nfdc route add /ledger/node2 udp://192.168.56.102
$ nfdc strategy set /ledger /localhost/nfd/strategy/multicast/%FD%03
$ nfdc strategy set /ledger/node2 /localhost/nfd/strategy/best-route/%FD%05
```

At node 2:

```sh
$ nfdc face create udp://192.168.56.101
$ nfdc route add /ledger udp://192.168.56.101
$ nfdc route add /ledger/node1 udp://192.168.56.101
$ nfdc strategy set /ledger /localhost/nfd/strategy/multicast/%FD%03
$ nfdc strategy set /ledger/node1 /localhost/nfd/strategy/best-route/%FD%05
```

If there are more nodes, you'll do same for each of their IP and routable prefix.
