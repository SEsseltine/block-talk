// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "forge-std/console.sol";
import "../src/BlockTalkMessenger.sol";
import "solady/utils/LibClone.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying BlockTalkMessenger with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy the implementation contract
        BlockTalkMessenger implementation = new BlockTalkMessenger();
        console.log("Implementation deployed at:", address(implementation));

        // Deploy the proxy
        address proxy = LibClone.deployERC1967(address(implementation));
        console.log("Proxy deployed at:", proxy);

        // Initialize the proxy
        BlockTalkMessenger proxiedContract = BlockTalkMessenger(proxy);

        // Set permanent message fee to 0.001 ETH (in wei)
        uint256 permanentMessageFee = 0.001 ether;
        proxiedContract.initialize(permanentMessageFee);

        console.log("Contract initialized with permanent message fee:", permanentMessageFee);
        console.log("Owner:", proxiedContract.owner());
        console.log("Permanent message fee:", proxiedContract.permanentMessageFee());

        vm.stopBroadcast();

        // Output deployment addresses for GitHub Action to parse
        console.log("Contract deployed at:", proxy);
        console.log("Implementation at:", address(implementation));
    }
}

contract UpgradeScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address proxyAddress = vm.envAddress("PROXY_ADDRESS");

        console.log("Upgrading BlockTalkMessenger proxy at:", proxyAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Deploy new implementation
        BlockTalkMessenger newImplementation = new BlockTalkMessenger();
        console.log("New implementation deployed at:", address(newImplementation));

        // Get the proxy contract
        BlockTalkMessenger proxy = BlockTalkMessenger(proxyAddress);

        // Upgrade the proxy (only owner can do this)
        proxy.upgradeToAndCall(
            address(newImplementation),
            "" // No additional initialization data needed
        );

        console.log("Proxy upgraded successfully");
        console.log("New implementation:", address(newImplementation));

        vm.stopBroadcast();

        // Output for GitHub Action
        console.log("Contract deployed at:", proxyAddress);
        console.log("Implementation at:", address(newImplementation));
    }
}
