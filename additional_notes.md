For linkedin main post :
Proud to introduce ChillSplit – A group expense tracker, fully On-Chain.
Focusing on abstracting most of the web3 friction (using Dynamic.xyz wallet with hidden signatures, gas sponsorship, EIP 7702, 2612)
No direct "wallet" and blockchain interactions for the user in the app, except for the ON-Ramping (=funding the wallet) process, that means :
- no gas fees for users
- they just have on click on buttons like they always did

with that in mind, i also focused on:
- informing the user the asynchronous nature of the tx as well as error handling in pop-ups
- mobile compatible


For linkedin post technical comment (that will be the first comment of the main post) :

no direct "wallet" interactions for the user in the app:
- Using EIP 7702 for transaction sponsoring, but keeping secure with the wallet signature (silent with Dynamic feature)
- except for the ON-Ramp process, but again I added Transak on top of the embedded Dynamic on-ramp process to have the faster and simplier workflow
- then for the debt repayment : using silent "Permit" message signature
with EIP 2612, no web3 friction, just a click on one button to process paiment;


Solidity Smart-contracts part --> save gas on :
    - private variables
    - custom errors instead of requires


      
