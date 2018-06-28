# NodeJS SAML App
SAML app for testing WSO2's SSO flow, created with NodeJS

## Setup
Certain files are <b>required</b> and need to be placed under the ```cert``` directory:
<br />

#### Generating ```cert.pem``` and ```key.pem``` (self-signed certificate):
```
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
``` 
This will prompt you for some information and then create 2 files: ```cert.pem``` and ```key.pem```. 
```key.pem``` needs to be placed under ```cert/generated/``` and ```cert.pem``` will need to be
 imported into the WSO2 keystore and then safely stored away.
 
<br />

#### Obtaining ```./cert/wso2/cert.pem```:
Download the SAML metadata of the resident Identity Provider of your WSO2 instance under your tenant.
 From within the metadata file you will find the ```X509Certificate``` within the 
 ```<X509Certificate>...</X509Certificate>``` tags. Take that content and place it in the 
 ```./cert/wso2/cert.pem``` between a set of tags as such:
 ```
 -----BEGIN CERTIFICATE-----
 <your certificate here>
 -----END CERTIFICATE-----
 ```

## WSO2

### SP Config:
![WSO2 SP Config](images/wso2_sp_config.png "wso2_sp_config")

Under ```Certificate Alias``` select the certificate you generated and imported into the WSO2
 keystore. It will have the same name as the file you imported ```cert.pem```.
 
Under ```SLO Response URL``` add the URL that the logout action should redirect to upon completion.

### ACS Index:
When setting up the app, make sure to add the Attribute Consuming Index from the setup page to
![ACS Index](images/acs_index.png "acs_index")
the Passport config file: ```config/passport.js``` under the ```ACS_INDEX``` key
```
ACS_INDEX: <your ACS Index here, eg: 1020365325>
```