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

##### Prerequisites

You need to install following packages/softwares to before checking out the code and get it running.

- Node.js v6+ (https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions)
- Named Data Networking Forwarding Daemon v0.6.4 (https://named-data.net/doc/NFD/current/INSTALL.html)

##### Installing ndn-ledger

Checkout the code from this repository and install required node modules.
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
