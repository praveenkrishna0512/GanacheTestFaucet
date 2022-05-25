// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./Owned.sol";
import "./Logger.sol";
import "./IFaucet.sol";

contract Faucet is Owned, Logger, IFaucet {

    uint public numOfFunders;

    mapping(address => bool) private funders;
    mapping(uint => address) private lutFunders;

    modifier limitWithdraw(uint amount) {
        require(
            amount <= 100000000000000000,
            "Only withdraw lesser than 0.1 ether!"
        );
        _;
    }

    receive() external payable {}

    function emitLog() public override pure returns(bytes32) {
        return "Hello World";
    }

    function addFunds() external override payable {
        address funder = msg.sender;
        if (!funders[funder]) {
            funders[funder] = true;
            lutFunders[numOfFunders] = funder;
            numOfFunders++;
        }
    }

    function withdraw(uint amount) external override limitWithdraw(amount) {
        payable(msg.sender).transfer(amount);
    }

    function getAllFunders() external view returns (address[] memory) {
        address[] memory _funders = new address[](numOfFunders);
        for (uint i = 0; i < numOfFunders; i++) {
            _funders[i] = lutFunders[i];
        }
        return _funders;
    }

    function getFunderAtIndex(uint8 index) external view returns(address) {
        return lutFunders[index];
    }


    // const instance = await Faucet.deployed()
    // instance.addFunds({from: accounts[0], value: "2000000000000000000"})
    // instance.withdraw("500000000000000000", {from: accounts[1]})
    // instance.getFunderAtIndex(0)
    // instance.getAllFunders()
}