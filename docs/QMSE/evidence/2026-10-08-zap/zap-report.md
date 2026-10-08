# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 2 |
| Informational | 3 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 11    |
| Low | Exceeded High | http://host.docker.internal:5061 | Percentage of responses with status code 4xx | 99 % |
| Info | Informational | http://host.docker.internal:5061 | Percentage of responses with status code 2xx | 1 % |
| Info | Informational | http://host.docker.internal:5061 | Percentage of endpoints with content type application/json | 1 % |
| Info | Informational | http://host.docker.internal:5061 | Percentage of endpoints with method DELETE | 2 % |
| Info | Informational | http://host.docker.internal:5061 | Percentage of endpoints with method GET | 59 % |
| Info | Informational | http://host.docker.internal:5061 | Percentage of endpoints with method PATCH | 1 % |
| Info | Informational | http://host.docker.internal:5061 | Percentage of endpoints with method POST | 33 % |
| Info | Informational | http://host.docker.internal:5061 | Percentage of endpoints with method PUT | 3 % |
| Info | Informational | http://host.docker.internal:5061 | Count of total endpoints | 473    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Low | 2 |
| Unexpected Content-Type was returned | Low | 2 |
| A Client Error response code was returned by the server | Informational | 480 |
| Authentication Request Identified | Informational | 2 |
| Non-Storable Content | Informational | Systemic |




## Alert Detail



### [ Cross-Origin-Resource-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Resource-Policy header is an opt-in header designed to counter side-channels attacks like Spectre. Resource should be specifically set as shareable amongst different origins.

* URL: http://host.docker.internal:5061/swagger/v1/swagger.json
  * Node Name: `http://host.docker.internal:5061/swagger/v1/swagger.json`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/forgot-password
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/forgot-password ()({email})`
  * Method: `POST`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``


Instances: 2

### Solution

Ensure that the application/web server sets the Cross-Origin-Resource-Policy header appropriately, and that it sets the Cross-Origin-Resource-Policy header to 'same-origin' for all web pages.
'same-site' is considered as less secured and should be avoided.
If resources must be shared, set the header to 'cross-origin'.
If possible, ensure that the end user uses a standards-compliant and modern web browser that supports the Cross-Origin-Resource-Policy header (https://caniuse.com/mdn-http_headers_cross-origin-resource-policy).

### Reference


* [ https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy ](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cross-Origin-Embedder-Policy)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 14

#### Source ID: 3

### [ Unexpected Content-Type was returned ](https://www.zaproxy.org/docs/alerts/100001/)



##### Low (High)

### Description

A Content-Type of text/html was returned by the server.
This is not one of the types expected to be returned by an API.
Raised by the 'Alert on Unexpected Content Types' script

* URL: http://host.docker.internal:5061/swagger/
  * Node Name: `http://host.docker.internal:5061/swagger/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:5061/swagger/index.html
  * Node Name: `http://host.docker.internal:5061/swagger/index.html`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``


Instances: 2

### Solution



### Reference




#### Source ID: 4

### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 401 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/id
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/id/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/permanent
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/permanent`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/permanent/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/permanent/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061
  * Node Name: `http://host.docker.internal:5061`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/
  * Node Name: `http://host.docker.internal:5061/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/4250100668401746264
  * Node Name: `http://host.docker.internal:5061/4250100668401746264`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api
  * Node Name: `http://host.docker.internal:5061/api`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/
  * Node Name: `http://host.docker.internal:5061/api/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/1249931389259504750
  * Node Name: `http://host.docker.internal:5061/api/1249931389259504750`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1
  * Node Name: `http://host.docker.internal:5061/api/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/
  * Node Name: `http://host.docker.internal:5061/api/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/2725841522067947566
  * Node Name: `http://host.docker.internal:5061/api/v1/2725841522067947566`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin
  * Node Name: `http://host.docker.internal:5061/api/v1/admin`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/8716540047135627392
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/8716540047135627392`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/4502378437495856918
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/4502378437495856918`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/8496218308552807626
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/8496218308552807626`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/actuator/health
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/7412369725548673407
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/7412369725548673407`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/9212907894841525350
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/9212907894841525350`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/4252652398690996958
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/4252652398690996958`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/id
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/id/
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/id/7909420670804870742
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/id/7909420670804870742`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/mine
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/mine`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/mine/
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/mine/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/audit%3FsubjectMemberId=subjectMemberId&page=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/audit (page,pageSize,subjectMemberId)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/audit/
  * Node Name: `http://host.docker.internal:5061/api/v1/audit/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth
  * Node Name: `http://host.docker.internal:5061/api/v1/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/1164365811170206906
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/1164365811170206906`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/8042561339376423755
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/8042561339376423755`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users%3Fpage=1&pageSize=20&search=ZAP
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users (page,pageSize,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/6446391188591035223
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/6446391188591035223`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/userId
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/userId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/userId/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/userId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/userId/4725227138216547893
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/userId/4725227138216547893`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/7949598238949810489
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/7949598238949810489`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/dashboard
  * Node Name: `http://host.docker.internal:5061/api/v1/dashboard`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/dashboard/
  * Node Name: `http://host.docker.internal:5061/api/v1/dashboard/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/dashboard/2153158172748380530
  * Node Name: `http://host.docker.internal:5061/api/v1/dashboard/2153158172748380530`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/dashboard/doctor
  * Node Name: `http://host.docker.internal:5061/api/v1/dashboard/doctor`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/dashboard/doctor/
  * Node Name: `http://host.docker.internal:5061/api/v1/dashboard/doctor/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/dashboard/family
  * Node Name: `http://host.docker.internal:5061/api/v1/dashboard/family`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/dashboard/family/
  * Node Name: `http://host.docker.internal:5061/api/v1/dashboard/family/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/6342991467108709568
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/6342991467108709568`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/case-pool%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/case-pool (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/case-pool/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/case-pool/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/directory%3Fsearch=ZAP&district=district
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/directory (district,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/directory/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/directory/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/7798214867987716457
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/7798214867987716457`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments%3Ffrom=from&to=to
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments (from,to)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/1767024446815569618
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/1767024446815569618`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/7399427980261642457
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/7399427980261642457`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/blocked-time
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/blocked-time`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/4671794085293181199
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/4671794085293181199`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/cases/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/families
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/families`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/families/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/families/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/families/8252179789120367670
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/families/8252179789120367670`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/families/familyId
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/families/familyId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/families/familyId/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/families/familyId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/4907682368433344375
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/4907682368433344375`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/2738871501468358184
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/2738871501468358184`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/5123490852656211493
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/5123490852656211493`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/1211971287753215014
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/1211971287753215014`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/5184066608873684932
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/5184066608873684932`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId/8698758195202240145
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId/8698758195202240145`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId/file
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId/file`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId/file/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/lab-reports/reportId/file/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/notes
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/notes`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/notes/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/notes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/notes/4713993275986974321
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/notes/4713993275986974321`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId/9222912580691974104
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId/9222912580691974104`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/profile
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/profile`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/profile/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/profile/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/schedule
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/schedule`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/schedule/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/schedule/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/processing-cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/processing-cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/processing-cases/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/processing-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/episodes
  * Node Name: `http://host.docker.internal:5061/api/v1/episodes`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/episodes/
  * Node Name: `http://host.docker.internal:5061/api/v1/episodes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/episodes/1628947972415936749
  * Node Name: `http://host.docker.internal:5061/api/v1/episodes/1628947972415936749`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/episodes/episodeId
  * Node Name: `http://host.docker.internal:5061/api/v1/episodes/episodeId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/episodes/episodeId/
  * Node Name: `http://host.docker.internal:5061/api/v1/episodes/episodeId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/episodes/episodeId/998118037733871908
  * Node Name: `http://host.docker.internal:5061/api/v1/episodes/episodeId/998118037733871908`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families
  * Node Name: `http://host.docker.internal:5061/api/v1/families`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/5218213187636497914
  * Node Name: `http://host.docker.internal:5061/api/v1/families/5218213187636497914`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/3757782563942409613
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/3757782563942409613`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/dashboard
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/dashboard`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/dashboard/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/dashboard/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/216475949298883902
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/216475949298883902`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id/4649659304765859604
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id/4649659304765859604`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/pending
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/pending`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/pending/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/pending/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor/7276077956022732325
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor/7276077956022732325`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor/slots%3Fdate=date
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor/slots (date)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor/slots/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor/slots/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/head-transfers
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/head-transfers`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/4493418292771599077
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/4493418292771599077`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/pending
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/pending`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/pending/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/pending/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/4666463729879160866
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/4666463729879160866`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/713231661650232061
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/713231661650232061`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/join-requests%3Fstatus=status
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/join-requests (status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/join-requests/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/join-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/members%3Fpage=1&pageSize=20&search=ZAP
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/members (page,pageSize,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/members/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/roster
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/roster`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/roster/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/roster/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/triage-cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/triage-cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/triage-cases/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/6427168177167424467
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/6427168177167424467`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/incoming
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/incoming`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/incoming/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/incoming/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/8234606247058349096
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/8234606247058349096`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/invitations
  * Node Name: `http://host.docker.internal:5061/api/v1/families/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/invitations/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/invitations/3296568916272257874
  * Node Name: `http://host.docker.internal:5061/api/v1/families/invitations/3296568916272257874`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/2161630486196194705
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/2161630486196194705`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/id
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/id/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/id/6285701735564703223
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/id/6285701735564703223`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/mine
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/mine`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/mine/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/mine/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/me
  * Node Name: `http://host.docker.internal:5061/api/v1/families/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/me/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/me/1762021965256564713
  * Node Name: `http://host.docker.internal:5061/api/v1/families/me/1762021965256564713`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/family-head
  * Node Name: `http://host.docker.internal:5061/api/v1/family-head`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/family-head/
  * Node Name: `http://host.docker.internal:5061/api/v1/family-head/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/family-head/3497070573584930085
  * Node Name: `http://host.docker.internal:5061/api/v1/family-head/3497070573584930085`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/family-head/me
  * Node Name: `http://host.docker.internal:5061/api/v1/family-head/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/family-head/me/
  * Node Name: `http://host.docker.internal:5061/api/v1/family-head/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/1805355703284550637
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/1805355703284550637`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/incoming
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/incoming`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/incoming/
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/incoming/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/invitationId
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/invitationId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/invitationId/
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/invitationId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/invitationId/3595309715248649791
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/invitationId/3595309715248649791`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/2288209043536000936
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/2288209043536000936`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/8425689670937396475
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/8425689670937396475`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/file
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/file`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/file/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/file/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members
  * Node Name: `http://host.docker.internal:5061/api/v1/members`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/6539110164284497309
  * Node Name: `http://host.docker.internal:5061/api/v1/members/6539110164284497309`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/me
  * Node Name: `http://host.docker.internal:5061/api/v1/members/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/me/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/2573729252005971388
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/2573729252005971388`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/consents
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/consents`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/consents/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/consents/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/consents/1146403873116125743
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/consents/1146403873116125743`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/episodes%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/episodes (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/episodes/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/episodes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/familial-risk
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/familial-risk`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/familial-risk/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/familial-risk/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/hereditary-flags
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/hereditary-flags`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/hereditary-flags/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/hereditary-flags/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/6847476962016317388
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/6847476962016317388`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/deleted
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/deleted`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/deleted/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/deleted/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/records%3Fpage=1&pageSize=20&search=ZAP&type=Condition&sort=newest
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/records (page,pageSize,search,sort,type)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/records/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/records/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/relationships
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/relationships`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/relationships/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/relationships/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/triage-cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/triage-cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/triage-cases/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/vitals
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/vitals`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/vitals/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/vitals/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/vitals/7209280243827085552
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/vitals/7209280243827085552`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/vitals/trends
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/vitals/trends`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/vitals/trends/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/vitals/trends/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications%3FunreadOnly=true
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications (unreadOnly)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/151912929366496450
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/151912929366496450`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/id
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/id/
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/id/5521260252001273177
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/id/5521260252001273177`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/inbox%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/inbox (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/inbox/
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/inbox/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/profile
  * Node Name: `http://host.docker.internal:5061/api/v1/profile`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/profile/
  * Node Name: `http://host.docker.internal:5061/api/v1/profile/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/profile/5789657442668458474
  * Node Name: `http://host.docker.internal:5061/api/v1/profile/5789657442668458474`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/profile/me
  * Node Name: `http://host.docker.internal:5061/api/v1/profile/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/profile/me/
  * Node Name: `http://host.docker.internal:5061/api/v1/profile/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records
  * Node Name: `http://host.docker.internal:5061/api/v1/records`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/
  * Node Name: `http://host.docker.internal:5061/api/v1/records/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/3447397978822068259
  * Node Name: `http://host.docker.internal:5061/api/v1/records/3447397978822068259`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId/4188669380443744807
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId/4188669380443744807`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/4285497532784182722
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/4285497532784182722`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/2207920318303949515
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/2207920318303949515`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/approved-guidance
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/approved-guidance`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/approved-guidance/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/approved-guidance/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/review
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/review`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/review/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/review/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/status
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/status`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/status/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/status/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/traces
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/traces`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/traces/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/traces/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/swagger/5019760517524149312
  * Node Name: `http://host.docker.internal:5061/swagger/5019760517524149312`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/swagger/v1
  * Node Name: `http://host.docker.internal:5061/swagger/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/swagger/v1/
  * Node Name: `http://host.docker.internal:5061/swagger/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/swagger/v1/8065321797809240202
  * Node Name: `http://host.docker.internal:5061/swagger/v1/8065321797809240202`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/sharing
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/sharing ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/sharing/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/sharing/ ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId/sharing
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId/sharing ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId/sharing/
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId/sharing/ ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/reject
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/reject ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/reject/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/reject/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/request-info
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/request-info ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/request-info/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/request-info/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/suspend
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/suspend ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/suspend/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/suspend/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/verification
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/verification ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/verification/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/verification/ ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/verify
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/verify ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/verify/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/doctors/doctorId/verify/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/reject
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/reject ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/reject/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/reject/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/request-info
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/request-info ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/request-info/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/request-info/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/suspend
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/suspend ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/suspend/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/suspend/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/verification
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/verification ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/verification/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/verification/ ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/verify
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/verify ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/admin/family-heads/userId/verify/
  * Node Name: `http://host.docker.internal:5061/api/v1/admin/family-heads/userId/verify/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments ()({memberId,startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/ ()({memberId,startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/id/cancel/
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/id/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/userId/reset-password
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/userId/reset-password ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/userId/reset-password/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/userId/reset-password/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/userId/toggle-status
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/userId/toggle-status ()({isActive,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/admin/users/userId/toggle-status/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/admin/users/userId/toggle-status/ ()({isActive,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/change-password
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/change-password ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/change-password
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/change-password ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/change-password/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/change-password/ ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/forgot-password
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/forgot-password ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/forgot-password/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/forgot-password/ ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/login/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/logout
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/logout`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/logout/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/logout/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/refresh
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/refresh ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/refresh
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/refresh ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/refresh/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/refresh/ ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/ ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/adult-member
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/adult-member ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/adult-member
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/adult-member ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/adult-member/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/adult-member/ ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/doctor
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/doctor ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/doctor
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/doctor ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/doctor/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/doctor/ ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/family-head
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/family-head ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/family-head
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/family-head ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/register/family-head/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/register/family-head/ ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/auth/reset-password/
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/reset-password/ ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/cancel ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/cancel/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/cancel/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/complete
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/complete ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/complete/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/complete/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/confirm
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/confirm ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/confirm/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/confirm/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/no-show
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/no-show ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/no-show/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/no-show/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/reschedule
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/reschedule ()({startsAt,note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/reschedule/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/reschedule/ ()({startsAt,note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/blocked-time
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/blocked-time ()({startsAt,endsAt,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/blocked-time/ ()({startsAt,endsAt,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/accept
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/accept/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/decline
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/decline/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/family-requests/id/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/notes
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/notes ()({content,noteType,appointmentId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/notes/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/members/memberId/notes/ ()({content,noteType,appointmentId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId/amend
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId/amend ()({content})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId/amend/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/notes/noteId/amend/ ()({content})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/register
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/register ()({registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/register/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/register/ ()({registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/episodes/episodeId/triage
  * Node Name: `http://host.docker.internal:5061/api/v1/episodes/episodeId/triage`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/episodes/episodeId/triage/
  * Node Name: `http://host.docker.internal:5061/api/v1/episodes/episodeId/triage/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families
  * Node Name: `http://host.docker.internal:5061/api/v1/families ()({name})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/ ()({name})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests ()({doctorId,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/ ()({doctorId,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id/cancel
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id/cancel/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/doctor-requests/id/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/head-transfers
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/head-transfers ()({toMemberId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/head-transfers/ ()({toMemberId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations ()({email,relationshipType})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/ ()({email,relationshipType})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/cancel
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/cancel/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/resend
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/resend ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/resend/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/invitations/invitationId/resend/ ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/members
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/members ()({displayName,dateOfBirth,role,userId,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/members/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/members/ ()({displayName,dateOfBirth,role,userId,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/accept
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/accept/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/cancel
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/cancel/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/decline
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/decline/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/head-transfers/transferId/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/invitations/accept
  * Node Name: `http://host.docker.internal:5061/api/v1/families/invitations/accept ()({token,dateOfBirth,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/invitations/accept/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/invitations/accept/ ()({token,dateOfBirth,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/ ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/id/accept
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/id/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/id/accept/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/id/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/id/decline
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/id/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/join-requests/id/decline/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/join-requests/id/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/me/leave
  * Node Name: `http://host.docker.internal:5061/api/v1/families/me/leave ()({startOwnFamily})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/me/leave/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/me/leave/ ()({startOwnFamily})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/invitationId/approve
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/invitationId/approve`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/invitationId/approve/
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/invitationId/approve/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/invitationId/reject
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/invitationId/reject`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/invitations/invitationId/reject/
  * Node Name: `http://host.docker.internal:5061/api/v1/invitations/invitationId/reject/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/extract
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/extract`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/extract/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/extract/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/restore
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/restore`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/restore/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/restore/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/consents/reaffirm
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/consents/reaffirm`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/consents/reaffirm/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/consents/reaffirm/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/episodes
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/episodes ()({symptoms:[],durationDays,severity,notes})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/episodes/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/episodes/ ()({symptoms:[],durationDays,severity,notes})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/lab-reports ()(multipart:File,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/lab-reports ()(multipart:rtobject,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/lab-reports/ ()(multipart:File,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/records
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/records ()({recordType,title,summary,occurredOn})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/records/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/records/ ()({recordType,title,summary,occurredOn})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/relationships
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/relationships ()({relatedMemberId,relationshipType,isBiological})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/relationships/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/relationships/ ()({relatedMemberId,relationshipType,isBiological})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/remove-from-family
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/remove-from-family`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/remove-from-family/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/remove-from-family/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/vitals
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/vitals ()({vitalType,value,unit,measuredAt})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/vitals/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/vitals/ ()({vitalType,value,unit,measuredAt})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/id/read
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/id/read`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/id/read/
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/id/read/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/subscribe
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/subscribe ()({deviceToken,platform})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/notifications/subscribe/
  * Node Name: `http://host.docker.internal:5061/api/v1/notifications/subscribe/ ()({deviceToken,platform})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/appointments
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/appointments ()({startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/appointments/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/appointments/ ()({startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/approve
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/approve ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/approve/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/approve/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/claim
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/claim`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/claim/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/claim/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/close-referral
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/close-referral`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/close-referral/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/close-referral/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/decision
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/decision ()({action,doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/decision/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/decision/ ()({action,doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/escalate
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/escalate ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/escalate/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/escalate/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/reject
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/reject ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/reject/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/reject/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/request-info
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/request-info ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/request-info/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/request-info/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/revise
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/revise ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/revise/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/revise/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/share-contact
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/share-contact`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/share-contact/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/share-contact/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/withdraw
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/withdraw`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/withdraw/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/withdraw/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/computeMetadata/v1/
  * Node Name: `http://host.docker.internal:5061/computeMetadata/v1/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/latest/meta-data/
  * Node Name: `http://host.docker.internal:5061/latest/meta-data/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/metadata/instance
  * Node Name: `http://host.docker.internal:5061/metadata/instance ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/metadata/v1
  * Node Name: `http://host.docker.internal:5061/metadata/v1 ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/opc/v1/instance/
  * Node Name: `http://host.docker.internal:5061/opc/v1/instance/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/opc/v2/instance/
  * Node Name: `http://host.docker.internal:5061/opc/v2/instance/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/openstack/latest/meta_data.json
  * Node Name: `http://host.docker.internal:5061/openstack/latest/meta_data.json ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/availability
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/availability ()({windows:[{dayOfWeek,startTime,endTime}]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/availability/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/availability/ ()({windows:[{dayOfWeek,startTime,endTime}]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/profile
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/profile ()({specialty,clinic,phoneNumber,district,city,languages,consultationModes,acceptingNewFamilies,slotMinutes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/profile/
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/profile/ ()({specialty,clinic,phoneNumber,district,city,languages,consultationModes,acceptingNewFamilies,slotMinutes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId ()({name})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/families/familyId/
  * Node Name: `http://host.docker.internal:5061/api/v1/families/familyId/ ()({name})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/review
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/review ()({values:[{id,analyte,value,unit,referenceLow,referenceHigh}],confirmedFlagIds:[]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/lab-reports/reportId/review/
  * Node Name: `http://host.docker.internal:5061/api/v1/lab-reports/reportId/review/ ()({values:[{id,analyte,value,unit,referenceLow,referenceHigh}],confirmedFlagIds:[]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId ()({displayName,dateOfBirth,role,sexForClinicalReference})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/ ()({displayName,dateOfBirth,role,sexForClinicalReference})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/consents/HereditaryFlags
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/consents/HereditaryFlags ()({status})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/members/memberId/consents/HereditaryFlags/
  * Node Name: `http://host.docker.internal:5061/api/v1/members/memberId/consents/HereditaryFlags/ ()({status})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/profile/me
  * Node Name: `http://host.docker.internal:5061/api/v1/profile/me ()({displayName})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/profile/me/
  * Node Name: `http://host.docker.internal:5061/api/v1/profile/me/ ()({displayName})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId ()({recordType,title,summary,occurredOn})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5061/api/v1/records/recordId/ ()({recordType,title,summary,occurredOn})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/submission
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/submission ()({symptoms:[],durationDays,severity,notes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/submission/
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/submission/ ()({symptoms:[],durationDays,severity,notes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `401`
  * Other Info: ``


Instances: 480

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (Low)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://host.docker.internal:5061/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `newPassword`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=newPassword`
* URL: http://host.docker.internal:5061/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5061/api/v1/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `password`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=password`


Instances: 2

### Solution

This is an informational alert rather than a vulnerability and so there is nothing to fix.

### Reference


* [ https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/ ](https://www.zaproxy.org/docs/desktop/addons/authentication-helper/auth-req-id/)



#### Source ID: 3

### [ Non-Storable Content ](https://www.zaproxy.org/docs/alerts/10049/)



##### Informational (Medium)

### Description

The response contents are not storable by caching components such as proxy servers. If the response does not contain sensitive, personal or user-specific information, it may benefit from being stored and cached, to improve performance.

* URL: http://host.docker.internal:5061/swagger/v1/swagger.json
  * Node Name: `http://host.docker.internal:5061/swagger/v1/swagger.json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5061/api/v1/appointments/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/cancel ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/complete
  * Node Name: `http://host.docker.internal:5061/api/v1/doctors/me/appointments/id/complete ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5061/api/v1/triage-cases/caseId/appointments
  * Node Name: `http://host.docker.internal:5061/api/v1/triage-cases/caseId/appointments ()({startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``

Instances: Systemic


### Solution

The content may be marked as storable by ensuring that the following conditions are satisfied:
The request method must be understood by the cache and defined as being cacheable ("GET", "HEAD", and "POST" are currently defined as cacheable)
The response status code must be understood by the cache (one of the 1XX, 2XX, 3XX, 4XX, or 5XX response classes are generally understood)
The "no-store" cache directive must not appear in the request or response header fields
For caching by "shared" caches such as "proxy" caches, the "private" response directive must not appear in the response
For caching by "shared" caches such as "proxy" caches, the "Authorization" header field must not appear in the request, unless the response explicitly allows it (using one of the "must-revalidate", "public", or "s-maxage" Cache-Control response directives)
In addition to the conditions above, at least one of the following conditions must also be satisfied by the response:
It must contain an "Expires" header field
It must contain a "max-age" response directive
For "shared" caches such as "proxy" caches, it must contain a "s-maxage" response directive
It must contain a "Cache Control Extension" that allows it to be cached
It must have a status code that is defined as cacheable by default (200, 203, 204, 206, 300, 301, 404, 405, 410, 414, 501).

### Reference


* [ https://datatracker.ietf.org/doc/html/rfc7234 ](https://datatracker.ietf.org/doc/html/rfc7234)
* [ https://datatracker.ietf.org/doc/html/rfc7231 ](https://datatracker.ietf.org/doc/html/rfc7231)
* [ https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html ](https://www.w3.org/Protocols/rfc2616/rfc2616-sec13.html)


#### CWE Id: [ 524 ](https://cwe.mitre.org/data/definitions/524.html)


#### WASC Id: 13

#### Source ID: 3


