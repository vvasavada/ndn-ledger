#!/bin/bash

nfd-start
nfdc face create udp://"$1"
nfdc route add /ledger udp://"$1"
nfdc route add /ledger"$2" udp://"$1"
nfdc route add "$2" udp://"$1"
nfdc strategy set /ledger /localhost/nfd/strategy/multicast/%FD%03
nfdc strategy set /ledger"$2" /localhost/nfd/strategy/best-route/%FD%05


