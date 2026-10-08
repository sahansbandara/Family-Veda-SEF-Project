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
| Low | Exceeded High | http://host.docker.internal:5091 | Percentage of responses with status code 4xx | 99 % |
| Info | Informational | http://host.docker.internal:5091 | Percentage of responses with status code 2xx | 10 % |
| Info | Informational | http://host.docker.internal:5091 | Percentage of endpoints with content type application/json | 6 % |
| Info | Informational | http://host.docker.internal:5091 | Percentage of endpoints with method DELETE | 2 % |
| Info | Informational | http://host.docker.internal:5091 | Percentage of endpoints with method GET | 58 % |
| Info | Informational | http://host.docker.internal:5091 | Percentage of endpoints with method PATCH | 1 % |
| Info | Informational | http://host.docker.internal:5091 | Percentage of endpoints with method POST | 34 % |
| Info | Informational | http://host.docker.internal:5091 | Percentage of endpoints with method PUT | 3 % |
| Info | Informational | http://host.docker.internal:5091 | Count of total endpoints | 459    |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Low | Systemic |
| Unexpected Content-Type was returned | Low | 2 |
| A Client Error response code was returned by the server | Informational | 459 |
| Authentication Request Identified | Informational | 2 |
| Non-Storable Content | Informational | Systemic |




## Alert Detail



### [ Cross-Origin-Resource-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Resource-Policy header is an opt-in header designed to counter side-channels attacks like Spectre. Resource should be specifically set as shareable amongst different origins.

* URL: http://host.docker.internal:5091/api/v1/doctors/me
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/cases (page,pageSize)`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5091/swagger/v1/swagger.json
  * Node Name: `http://host.docker.internal:5091/swagger/v1/swagger.json`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/forgot-password
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/forgot-password ()({email})`
  * Method: `POST`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/logout
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/logout`
  * Method: `POST`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``

Instances: Systemic


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

* URL: http://host.docker.internal:5091/swagger/
  * Node Name: `http://host.docker.internal:5091/swagger/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:5091/swagger/index.html
  * Node Name: `http://host.docker.internal:5091/swagger/index.html`
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

A response code of 403 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/id
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/id/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/permanent
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/permanent`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/permanent/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/permanent/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091
  * Node Name: `http://host.docker.internal:5091`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/
  * Node Name: `http://host.docker.internal:5091/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/1751413801898793343
  * Node Name: `http://host.docker.internal:5091/1751413801898793343`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api
  * Node Name: `http://host.docker.internal:5091/api`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/
  * Node Name: `http://host.docker.internal:5091/api/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/8979646449268433575
  * Node Name: `http://host.docker.internal:5091/api/8979646449268433575`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1
  * Node Name: `http://host.docker.internal:5091/api/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/
  * Node Name: `http://host.docker.internal:5091/api/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/5791724067535347412
  * Node Name: `http://host.docker.internal:5091/api/v1/5791724067535347412`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin
  * Node Name: `http://host.docker.internal:5091/api/v1/admin`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/8549258293675092116
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/8549258293675092116`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/5425770802318822654
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/5425770802318822654`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/7830602145989584073
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/7830602145989584073`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/actuator/health
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/2297017386283647818
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/2297017386283647818`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/5328258824376306794
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/5328258824376306794`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/7899099316916589714
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/7899099316916589714`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/id
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/id/
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/id/4988449855691847605
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/id/4988449855691847605`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/mine
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/mine`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/mine/
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/mine/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/audit%3FsubjectMemberId=subjectMemberId&page=1&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/audit (page,pageSize,subjectMemberId)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/audit/
  * Node Name: `http://host.docker.internal:5091/api/v1/audit/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth
  * Node Name: `http://host.docker.internal:5091/api/v1/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/7158218863099802927
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/7158218863099802927`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/1585034015247353055
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/1585034015247353055`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users%3Fpage=1&pageSize=20&search=ZAP
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users (page,pageSize,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/7747900949618872373
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/7747900949618872373`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/userId
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/userId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/userId/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/userId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/userId/4072412915966743610
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/userId/4072412915966743610`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/2599355313838135737
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/2599355313838135737`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/dashboard
  * Node Name: `http://host.docker.internal:5091/api/v1/dashboard`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/dashboard/
  * Node Name: `http://host.docker.internal:5091/api/v1/dashboard/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/dashboard/8916509035297912228
  * Node Name: `http://host.docker.internal:5091/api/v1/dashboard/8916509035297912228`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/dashboard/family
  * Node Name: `http://host.docker.internal:5091/api/v1/dashboard/family`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/dashboard/family/
  * Node Name: `http://host.docker.internal:5091/api/v1/dashboard/family/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/7019808866866587608
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/7019808866866587608`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/case-pool%3Fpage=http%253A%252F%252Fwww.google.com%252F&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/case-pool (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/directory%3Fsearch=ZAP&district=district
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/directory (district,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/directory/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/directory/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/1275918787591196307
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/1275918787591196307`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments%3Ffrom=from&to=to
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments (from,to)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/6651308187426895071
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/6651308187426895071`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/4740048292611763026
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/4740048292611763026`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/blocked-time
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/blocked-time`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/8306584448675280759
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/8306584448675280759`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/cases%3Fpage=http%253A%252F%252Fwww.google.com%252F&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/families
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/families`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/families/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/families/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/families/378369379789801289
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/families/378369379789801289`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/families/familyId
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/families/familyId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/families/familyId/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/families/familyId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/family-requests/8612851174139900875
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/family-requests/8612851174139900875`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/920532365497483574
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/920532365497483574`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/2746870500483689395
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/2746870500483689395`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/2030093162478045593
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/2030093162478045593`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/4564601917173314205
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/4564601917173314205`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId/4548158320189548114
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId/4548158320189548114`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId/file
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId/file`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId/file/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/lab-reports/reportId/file/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/notes
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/notes`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/notes/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/notes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/notes/5030254295386590002
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/notes/5030254295386590002`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId/8360901572869332423
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId/8360901572869332423`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/processing-cases%3Fpage=http%253A%252F%252Fwww.google.com%252F&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/processing-cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/episodes
  * Node Name: `http://host.docker.internal:5091/api/v1/episodes`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/episodes/
  * Node Name: `http://host.docker.internal:5091/api/v1/episodes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/episodes/1938620921586937567
  * Node Name: `http://host.docker.internal:5091/api/v1/episodes/1938620921586937567`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/episodes/episodeId
  * Node Name: `http://host.docker.internal:5091/api/v1/episodes/episodeId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/episodes/episodeId/
  * Node Name: `http://host.docker.internal:5091/api/v1/episodes/episodeId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/episodes/episodeId/810421013450492645
  * Node Name: `http://host.docker.internal:5091/api/v1/episodes/episodeId/810421013450492645`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families
  * Node Name: `http://host.docker.internal:5091/api/v1/families`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/319301719035004901
  * Node Name: `http://host.docker.internal:5091/api/v1/families/319301719035004901`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/8173411956533515104
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/8173411956533515104`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/dashboard
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/dashboard`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/dashboard/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/dashboard/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/1855084900697642213
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/1855084900697642213`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id/3237923576462422633
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id/3237923576462422633`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/pending
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/pending`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/pending/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/pending/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor/7331508957174451195
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor/7331508957174451195`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor/slots%3Fdate=date
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor/slots (date)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor/slots/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor/slots/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/head-transfers
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/head-transfers`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/3186182533209719118
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/3186182533209719118`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/pending
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/pending`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/pending/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/pending/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/6533200511652242532
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/6533200511652242532`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/5550413101854691646
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/5550413101854691646`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/join-requests%3Fstatus=status
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/join-requests (status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/join-requests/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/join-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/members%3Fpage=1&pageSize=20&search=ZAP
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/members (page,pageSize,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/members/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/roster
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/roster`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/roster/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/roster/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/triage-cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/triage-cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/triage-cases/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/1776210152580287569
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/1776210152580287569`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/incoming
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/incoming`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/incoming/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/incoming/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/8500667799158673726
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/8500667799158673726`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/invitations
  * Node Name: `http://host.docker.internal:5091/api/v1/families/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/invitations/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/invitations/1435396402768016476
  * Node Name: `http://host.docker.internal:5091/api/v1/families/invitations/1435396402768016476`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/8568845680335481086
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/8568845680335481086`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/id
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/id/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/id/7011237169480799597
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/id/7011237169480799597`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/mine
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/mine`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/mine/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/mine/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/me
  * Node Name: `http://host.docker.internal:5091/api/v1/families/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/me/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/me/4436958627042195070
  * Node Name: `http://host.docker.internal:5091/api/v1/families/me/4436958627042195070`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/family-head
  * Node Name: `http://host.docker.internal:5091/api/v1/family-head`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/family-head/
  * Node Name: `http://host.docker.internal:5091/api/v1/family-head/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/family-head/3968017456479176866
  * Node Name: `http://host.docker.internal:5091/api/v1/family-head/3968017456479176866`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/family-head/me
  * Node Name: `http://host.docker.internal:5091/api/v1/family-head/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/family-head/me/
  * Node Name: `http://host.docker.internal:5091/api/v1/family-head/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/8808506709069910690
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/8808506709069910690`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/incoming
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/incoming`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/incoming/
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/incoming/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/invitationId
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/invitationId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/invitationId/
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/invitationId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/invitationId/617877881892295745
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/invitationId/617877881892295745`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/8237152712847751465
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/8237152712847751465`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/1585351939209831711
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/1585351939209831711`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/file
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/file`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/file/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/file/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members
  * Node Name: `http://host.docker.internal:5091/api/v1/members`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/7334210071239508237
  * Node Name: `http://host.docker.internal:5091/api/v1/members/7334210071239508237`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/me
  * Node Name: `http://host.docker.internal:5091/api/v1/members/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/me/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/3502878568519047210
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/3502878568519047210`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/consents
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/consents`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/consents/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/consents/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/consents/3292004539201269746
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/consents/3292004539201269746`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/episodes%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/episodes (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/episodes/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/episodes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/familial-risk
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/familial-risk`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/familial-risk/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/familial-risk/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/hereditary-flags
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/hereditary-flags`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/hereditary-flags/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/hereditary-flags/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/7070430421654901448
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/7070430421654901448`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/deleted
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/deleted`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/deleted/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/deleted/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/records%3Fpage=1&pageSize=20&search=ZAP&type=Condition&sort=newest
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/records (page,pageSize,search,sort,type)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/records/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/records/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/relationships
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/relationships`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/relationships/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/relationships/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/triage-cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/triage-cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/triage-cases/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/vitals
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/vitals`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/vitals/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/vitals/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/vitals/5312362518372897009
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/vitals/5312362518372897009`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/vitals/trends
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/vitals/trends`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/vitals/trends/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/vitals/trends/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications%3FunreadOnly=http%253A%252F%252Fwww.google.com%252F
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications (unreadOnly)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/5049653337423805709
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/5049653337423805709`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/id
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/id/
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/id/9079024535553851128
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/id/9079024535553851128`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/inbox%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/inbox (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/inbox/
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/inbox/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/profile
  * Node Name: `http://host.docker.internal:5091/api/v1/profile`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/profile/
  * Node Name: `http://host.docker.internal:5091/api/v1/profile/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/profile/796277890402033943
  * Node Name: `http://host.docker.internal:5091/api/v1/profile/796277890402033943`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records
  * Node Name: `http://host.docker.internal:5091/api/v1/records`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/
  * Node Name: `http://host.docker.internal:5091/api/v1/records/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/547696302675331365
  * Node Name: `http://host.docker.internal:5091/api/v1/records/547696302675331365`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId/8173679429127869647
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId/8173679429127869647`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/2317982609491192426
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/2317982609491192426`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/1298049180863018617
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/1298049180863018617`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/approved-guidance
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/approved-guidance`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/approved-guidance/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/approved-guidance/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/review
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/review`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/review/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/review/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/status
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/status`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/status/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/status/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/traces
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/traces`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/traces/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/traces/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/swagger/8515110925378852264
  * Node Name: `http://host.docker.internal:5091/swagger/8515110925378852264`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/swagger/v1
  * Node Name: `http://host.docker.internal:5091/swagger/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/swagger/v1/
  * Node Name: `http://host.docker.internal:5091/swagger/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/swagger/v1/7618398420811890627
  * Node Name: `http://host.docker.internal:5091/swagger/v1/7618398420811890627`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/sharing
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/sharing ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/sharing/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/sharing/ ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId/sharing
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId/sharing ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId/sharing/
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId/sharing/ ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/reject
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/reject ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/reject/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/reject/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/request-info
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/request-info ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/request-info/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/request-info/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/suspend
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/suspend ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/suspend/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/suspend/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/verification
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/verification ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/verification/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/verification/ ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/verify
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/verify ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/verify/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/doctors/doctorId/verify/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/reject
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/reject ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/reject/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/reject/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/request-info
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/request-info ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/request-info/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/request-info/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/suspend
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/suspend ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/suspend/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/suspend/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/verification
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/verification ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/verification/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/verification/ ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/verify
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/verify ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/admin/family-heads/userId/verify/
  * Node Name: `http://host.docker.internal:5091/api/v1/admin/family-heads/userId/verify/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments ()({memberId,startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/ ()({memberId,startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/appointments/id/cancel/
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/id/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/userId/reset-password
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/userId/reset-password ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/userId/reset-password/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/userId/reset-password/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/userId/toggle-status
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/userId/toggle-status ()({isActive,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/admin/users/userId/toggle-status/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/admin/users/userId/toggle-status/ ()({isActive,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/change-password
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/change-password ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/change-password
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/change-password ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/change-password/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/change-password/ ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/forgot-password
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/forgot-password ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/forgot-password/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/forgot-password/ ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/login/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/logout/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/logout/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/refresh
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/refresh ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/refresh
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/refresh ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/refresh/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/refresh/ ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/ ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/adult-member
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/adult-member ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/adult-member
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/adult-member ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/adult-member/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/adult-member/ ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/doctor
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/doctor ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/doctor
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/doctor ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/doctor/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/doctor/ ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/family-head
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/family-head ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/family-head
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/family-head ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/register/family-head/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/register/family-head/ ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/auth/reset-password/
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/reset-password/ ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/cancel ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/cancel/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/cancel/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/complete
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/complete ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/complete/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/complete/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/confirm
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/confirm ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/confirm/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/confirm/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/no-show
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/no-show ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/no-show/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/no-show/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/reschedule
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/reschedule ()({startsAt,note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/reschedule/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/reschedule/ ()({startsAt,note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/blocked-time
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/blocked-time ()({startsAt,endsAt,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/blocked-time/ ()({startsAt,endsAt,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/accept
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/accept/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/decline
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/decline/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/family-requests/id/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/notes
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/notes ()({content,noteType,appointmentId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/notes/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/members/memberId/notes/ ()({content,noteType,appointmentId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId/amend
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId/amend ()({content})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId/amend/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/notes/noteId/amend/ ()({content})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/register
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/register ()({registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/register/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/register/ ()({registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/episodes/episodeId/triage
  * Node Name: `http://host.docker.internal:5091/api/v1/episodes/episodeId/triage`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/episodes/episodeId/triage/
  * Node Name: `http://host.docker.internal:5091/api/v1/episodes/episodeId/triage/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families
  * Node Name: `http://host.docker.internal:5091/api/v1/families ()({name})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/ ()({name})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests ()({doctorId,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/ ()({doctorId,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id/cancel
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id/cancel/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/doctor-requests/id/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/head-transfers
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/head-transfers ()({toMemberId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/head-transfers/ ()({toMemberId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations ()({email,relationshipType})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/ ()({email,relationshipType})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/cancel
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/cancel/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/resend
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/resend ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/resend/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/invitations/invitationId/resend/ ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/members
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/members ()({displayName,dateOfBirth,role,userId,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/members/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/members/ ()({displayName,dateOfBirth,role,userId,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/accept
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/accept/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/cancel
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/cancel/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/decline
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/decline/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/head-transfers/transferId/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/invitations/accept
  * Node Name: `http://host.docker.internal:5091/api/v1/families/invitations/accept ()({token,dateOfBirth,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/invitations/accept/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/invitations/accept/ ()({token,dateOfBirth,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/ ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/id/accept
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/id/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/id/accept/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/id/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/id/decline
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/id/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/join-requests/id/decline/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/join-requests/id/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/me/leave
  * Node Name: `http://host.docker.internal:5091/api/v1/families/me/leave ()({startOwnFamily})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/me/leave/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/me/leave/ ()({startOwnFamily})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/invitationId/approve
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/invitationId/approve`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/invitationId/approve/
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/invitationId/approve/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/invitationId/reject
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/invitationId/reject`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/invitations/invitationId/reject/
  * Node Name: `http://host.docker.internal:5091/api/v1/invitations/invitationId/reject/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/extract
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/extract`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/extract/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/extract/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/restore
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/restore`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/restore/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/restore/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/consents/reaffirm
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/consents/reaffirm`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/consents/reaffirm/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/consents/reaffirm/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/episodes
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/episodes ()({symptoms:[],durationDays,severity,notes})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/episodes/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/episodes/ ()({symptoms:[],durationDays,severity,notes})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/lab-reports ()(multipart:File,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/lab-reports ()(multipart:rtobject,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/lab-reports/ ()(multipart:File,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/records
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/records ()({recordType,title,summary,occurredOn})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/records/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/records/ ()({recordType,title,summary,occurredOn})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/relationships
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/relationships ()({relatedMemberId,relationshipType,isBiological})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/relationships/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/relationships/ ()({relatedMemberId,relationshipType,isBiological})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/remove-from-family
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/remove-from-family`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/remove-from-family/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/remove-from-family/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/vitals
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/vitals ()({vitalType,value,unit,measuredAt})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/vitals/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/vitals/ ()({vitalType,value,unit,measuredAt})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/id/read
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/id/read`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/id/read/
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/id/read/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/subscribe
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/subscribe ()({deviceToken,platform})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/notifications/subscribe/
  * Node Name: `http://host.docker.internal:5091/api/v1/notifications/subscribe/ ()({deviceToken,platform})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/appointments
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/appointments ()({startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/appointments/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/appointments/ ()({startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/approve
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/approve ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/approve/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/approve/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/claim
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/claim`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/claim/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/claim/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/close-referral
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/close-referral`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/close-referral/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/close-referral/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/decision
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/decision ()({action,doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/decision/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/decision/ ()({action,doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/escalate
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/escalate ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/escalate/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/escalate/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/reject
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/reject ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/reject/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/reject/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/request-info
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/request-info ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/request-info/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/request-info/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/revise
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/revise ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/revise/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/revise/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/share-contact
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/share-contact`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/share-contact/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/share-contact/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/withdraw
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/withdraw`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/withdraw/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/withdraw/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/computeMetadata/v1/
  * Node Name: `http://host.docker.internal:5091/computeMetadata/v1/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/latest/meta-data/
  * Node Name: `http://host.docker.internal:5091/latest/meta-data/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/metadata/instance
  * Node Name: `http://host.docker.internal:5091/metadata/instance ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/metadata/v1
  * Node Name: `http://host.docker.internal:5091/metadata/v1 ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/opc/v1/instance/
  * Node Name: `http://host.docker.internal:5091/opc/v1/instance/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/opc/v2/instance/
  * Node Name: `http://host.docker.internal:5091/opc/v2/instance/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/openstack/latest/meta_data.json
  * Node Name: `http://host.docker.internal:5091/openstack/latest/meta_data.json ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/availability
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/availability ()({windows:[{dayOfWeek,startTime,endTime}]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/availability/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/availability/ ()({windows:[{dayOfWeek,startTime,endTime}]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/profile
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/profile ()({specialty,clinic,phoneNumber,district,city,languages,consultationModes,acceptingNewFamilies,slotMinutes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/profile/
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/profile/ ()({specialty,clinic,phoneNumber,district,city,languages,consultationModes,acceptingNewFamilies,slotMinutes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId ()({name})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/families/familyId/
  * Node Name: `http://host.docker.internal:5091/api/v1/families/familyId/ ()({name})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/review
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/review ()({values:[{id,analyte,value,unit,referenceLow,referenceHigh}],confirmedFlagIds:[]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/lab-reports/reportId/review/
  * Node Name: `http://host.docker.internal:5091/api/v1/lab-reports/reportId/review/ ()({values:[{id,analyte,value,unit,referenceLow,referenceHigh}],confirmedFlagIds:[]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId ()({displayName,dateOfBirth,role,sexForClinicalReference})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/ ()({displayName,dateOfBirth,role,sexForClinicalReference})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/consents/HereditaryFlags
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/consents/HereditaryFlags ()({status})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/members/memberId/consents/HereditaryFlags/
  * Node Name: `http://host.docker.internal:5091/api/v1/members/memberId/consents/HereditaryFlags/ ()({status})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/profile/me
  * Node Name: `http://host.docker.internal:5091/api/v1/profile/me ()({displayName})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId ()({recordType,title,summary,occurredOn})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5091/api/v1/records/recordId/ ()({recordType,title,summary,occurredOn})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/submission
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/submission ()({symptoms:[],durationDays,severity,notes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/triage-cases/caseId/submission/
  * Node Name: `http://host.docker.internal:5091/api/v1/triage-cases/caseId/submission/ ()({symptoms:[],durationDays,severity,notes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``


Instances: 459

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://host.docker.internal:5091/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `newPassword`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=newPassword`
* URL: http://host.docker.internal:5091/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5091/api/v1/auth/login ()({email,password})`
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

* URL: http://host.docker.internal:5091/api/v1/appointments/mine
  * Node Name: `http://host.docker.internal:5091/api/v1/appointments/mine`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments%3Ffrom=from&to=to
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments (from,to)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5091/swagger/v1/swagger.json
  * Node Name: `http://host.docker.internal:5091/swagger/v1/swagger.json`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/confirm
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/confirm ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/reschedule
  * Node Name: `http://host.docker.internal:5091/api/v1/doctors/me/appointments/id/reschedule ()({startsAt,note})`
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


