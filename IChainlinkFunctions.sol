// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IChainlinkFunctions {
    function sendRequest(
        bytes32 jobId,
        string calldata data,
        string[] calldata path
    ) external returns (bytes32 requestId);
    
    function fulfillRequest(
        bytes32 requestId,
        bytes calldata response
    ) external;
}
