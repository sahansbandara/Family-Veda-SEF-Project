# ZAP Scanning Report

ZAP by [Checkmarx](https://checkmarx.com/).


## Summary of Alerts

| Risk Level | Number of Alerts |
| --- | --- |
| High | 0 |
| Medium | 0 |
| Low | 4 |
| Informational | 3 |




## Insights

| Level | Reason | Site | Description | Statistic |
| --- | --- | --- | --- | --- |
| Low | Warning |  | ZAP warnings logged - see the zap.log file for details | 10    |
| Low | Exceeded High | http://host.docker.internal:5060 | Percentage of responses with status code 4xx | 98 % |
| Info | Informational | http://host.docker.internal:5060 | Percentage of responses with status code 2xx | 1 % |
| Info | Informational | http://host.docker.internal:5060 | Percentage of endpoints with content type application/json | 7 % |
| Info | Informational | http://host.docker.internal:5060 | Percentage of endpoints with method DELETE | 2 % |
| Info | Informational | http://host.docker.internal:5060 | Percentage of endpoints with method GET | 58 % |
| Info | Informational | http://host.docker.internal:5060 | Percentage of endpoints with method POST | 34 % |
| Info | Informational | http://host.docker.internal:5060 | Percentage of endpoints with method PUT | 3 % |
| Info | Informational | http://host.docker.internal:5060 | Count of total endpoints | 452    |
| Info | Informational | http://host.docker.internal:5060 | Percentage of slow responses | 5 % |







## Alerts

| Name | Risk Level | Number of Instances |
| --- | --- | --- |
| A Server Error response code was returned by the server | Low | 1 |
| Cross-Origin-Resource-Policy Header Missing or Invalid | Low | Systemic |
| Unexpected Content-Type was returned | Low | 2 |
| X-Content-Type-Options Header Missing | Low | Systemic |
| A Client Error response code was returned by the server | Informational | 450 |
| Authentication Request Identified | Informational | 2 |
| Non-Storable Content | Informational | Systemic |




## Alert Detail



### [ A Server Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Low (High)

### Description

A response code of 500 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://host.docker.internal:5060/api/v1/doctors/directory%3Fsearch=%2500&district=district
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/directory (district,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `500`
  * Other Info: ``


Instances: 1

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Cross-Origin-Resource-Policy Header Missing or Invalid ](https://www.zaproxy.org/docs/alerts/90004/)



##### Low (Medium)

### Description

Cross-Origin-Resource-Policy header is an opt-in header designed to counter side-channels attacks like Spectre. Resource should be specifically set as shareable amongst different origins.

* URL: http://host.docker.internal:5060/api/v1/appointments/mine
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/mine`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/family-head/me
  * Node Name: `http://host.docker.internal:5060/api/v1/family-head/me`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5060/swagger/v1/swagger.json
  * Node Name: `http://host.docker.internal:5060/swagger/v1/swagger.json`
  * Method: `GET`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/forgot-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/forgot-password ()({email})`
  * Method: `POST`
  * Parameter: `Cross-Origin-Resource-Policy`
  * Attack: ``
  * Evidence: ``
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/logout
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/logout`
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

* URL: http://host.docker.internal:5060/swagger/
  * Node Name: `http://host.docker.internal:5060/swagger/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``
* URL: http://host.docker.internal:5060/swagger/index.html
  * Node Name: `http://host.docker.internal:5060/swagger/index.html`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `text/html`
  * Other Info: ``


Instances: 2

### Solution



### Reference




#### Source ID: 4

### [ X-Content-Type-Options Header Missing ](https://www.zaproxy.org/docs/alerts/10021/)



##### Low (Medium)

### Description

The Anti-MIME-Sniffing header X-Content-Type-Options was not set to 'nosniff'. This allows older versions of Internet Explorer and Chrome to perform MIME-sniffing on the response body, potentially causing the response body to be interpreted and displayed as a content type other than the declared content type. Current (early 2014) and legacy versions of Firefox will use the declared content type (if one is set), rather than performing MIME-sniffing.

* URL: http://host.docker.internal:5060/api/v1/appointments/mine
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/mine`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`
* URL: http://host.docker.internal:5060/api/v1/dashboard/family
  * Node Name: `http://host.docker.internal:5060/api/v1/dashboard/family`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`
* URL: http://host.docker.internal:5060/api/v1/family-head/me
  * Node Name: `http://host.docker.internal:5060/api/v1/family-head/me`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`
* URL: http://host.docker.internal:5060/swagger/v1/swagger.json
  * Node Name: `http://host.docker.internal:5060/swagger/v1/swagger.json`
  * Method: `GET`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`
* URL: http://host.docker.internal:5060/api/v1/auth/forgot-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/forgot-password ()({email})`
  * Method: `POST`
  * Parameter: `x-content-type-options`
  * Attack: ``
  * Evidence: ``
  * Other Info: `This issue still applies to error type pages (401, 403, 500, etc.) as those pages are often still affected by injection issues, in which case there is still concern for browsers sniffing pages away from their actual content type.
At "High" threshold this scan rule will not alert on client or server error responses.`

Instances: Systemic


### Solution

Ensure that the application/web server sets the Content-Type header appropriately, and that it sets the X-Content-Type-Options header to 'nosniff' for all web pages.
If possible, ensure that the end user uses a standards-compliant and modern web browser that does not perform MIME-sniffing at all, or that can be directed by the web application/web server to not perform MIME-sniffing.

### Reference


* [ https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/gg622941(v=vs.85) ](https://learn.microsoft.com/en-us/previous-versions/windows/internet-explorer/ie-developer/compatibility/gg622941(v=vs.85))
* [ https://owasp.org/www-community/Security_Headers ](https://owasp.org/www-community/Security_Headers)


#### CWE Id: [ 693 ](https://cwe.mitre.org/data/definitions/693.html)


#### WASC Id: 15

#### Source ID: 3

### [ A Client Error response code was returned by the server ](https://www.zaproxy.org/docs/alerts/100000/)



##### Informational (High)

### Description

A response code of 400 was returned by the server.
This may indicate that the application is failing to handle unexpected input correctly.
Raised by the 'Alert on HTTP Response Code Error' script

* URL: http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/id
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/id`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/id/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/id/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/permanent
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/permanent`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/permanent/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/permanent/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId/`
  * Method: `DELETE`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060
  * Node Name: `http://host.docker.internal:5060`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/
  * Node Name: `http://host.docker.internal:5060/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/7596814343781097789
  * Node Name: `http://host.docker.internal:5060/7596814343781097789`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api
  * Node Name: `http://host.docker.internal:5060/api`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/
  * Node Name: `http://host.docker.internal:5060/api/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/6409969590874349940
  * Node Name: `http://host.docker.internal:5060/api/6409969590874349940`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1
  * Node Name: `http://host.docker.internal:5060/api/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/
  * Node Name: `http://host.docker.internal:5060/api/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/5270585129629649160
  * Node Name: `http://host.docker.internal:5060/api/v1/5270585129629649160`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin
  * Node Name: `http://host.docker.internal:5060/api/v1/admin`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/9048019692476994449
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/9048019692476994449`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/3242813020990187486
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/3242813020990187486`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/2587050166987746531
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/2587050166987746531`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/actuator/health
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/actuator/health`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/8435410709676206855
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/8435410709676206855`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/169280232433075008
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/169280232433075008`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/9036979287176954807
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/9036979287176954807`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/id
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/id/
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/id/4250315752872201297
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/id/4250315752872201297`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/audit%3FsubjectMemberId=subjectMemberId&page=1&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/audit (page,pageSize,subjectMemberId)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth
  * Node Name: `http://host.docker.internal:5060/api/v1/auth`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/3675722992476090533
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/3675722992476090533`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/8426881134459771098
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/8426881134459771098`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users%3Fpage=1&pageSize=20&search=ZAP
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users (page,pageSize,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/5598039376116010206
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/5598039376116010206`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/userId
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/userId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/userId/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/userId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/userId/7440133295194521374
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/userId/7440133295194521374`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/2373278436661491669
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/2373278436661491669`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/dashboard
  * Node Name: `http://host.docker.internal:5060/api/v1/dashboard`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/dashboard/
  * Node Name: `http://host.docker.internal:5060/api/v1/dashboard/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/dashboard/8746416555747711595
  * Node Name: `http://host.docker.internal:5060/api/v1/dashboard/8746416555747711595`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/dashboard/doctor
  * Node Name: `http://host.docker.internal:5060/api/v1/dashboard/doctor`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/dashboard/doctor/
  * Node Name: `http://host.docker.internal:5060/api/v1/dashboard/doctor/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/6164303405678531905
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/6164303405678531905`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/case-pool%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/case-pool (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/case-pool/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/case-pool/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/8837188953319142368
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/8837188953319142368`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments%3Ffrom=from&to=to
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments (from,to)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/2096702355192794909
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/2096702355192794909`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/303489755367315074
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/303489755367315074`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/blocked-time
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/blocked-time`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/2076042405401318758
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/2076042405401318758`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/cases/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/families
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/families`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/families/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/families/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/families/3327978467716941822
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/families/3327978467716941822`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/families/familyId
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/families/familyId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/families/familyId/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/families/familyId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/1898220652788085782
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/1898220652788085782`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/720160950101217309
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/720160950101217309`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/2835907041642407426
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/2835907041642407426`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/7497941249632931605
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/7497941249632931605`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/2276220112824622610
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/2276220112824622610`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId/5317777016967757907
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId/5317777016967757907`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId/file
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId/file`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId/file/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/lab-reports/reportId/file/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/notes
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/notes`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/notes/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/notes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/notes/4701974028895320415
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/notes/4701974028895320415`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId/2646814445326799912
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId/2646814445326799912`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/profile
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/profile`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/profile/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/profile/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/schedule
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/schedule`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/schedule/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/schedule/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/episodes
  * Node Name: `http://host.docker.internal:5060/api/v1/episodes`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/episodes/
  * Node Name: `http://host.docker.internal:5060/api/v1/episodes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/episodes/2431204739529543707
  * Node Name: `http://host.docker.internal:5060/api/v1/episodes/2431204739529543707`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/episodes/episodeId
  * Node Name: `http://host.docker.internal:5060/api/v1/episodes/episodeId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/episodes/episodeId/
  * Node Name: `http://host.docker.internal:5060/api/v1/episodes/episodeId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/episodes/episodeId/5929260866438176755
  * Node Name: `http://host.docker.internal:5060/api/v1/episodes/episodeId/5929260866438176755`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families
  * Node Name: `http://host.docker.internal:5060/api/v1/families`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/5566263927071159699
  * Node Name: `http://host.docker.internal:5060/api/v1/families/5566263927071159699`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/1205756135206658943
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/1205756135206658943`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/dashboard
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/dashboard`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/dashboard/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/dashboard/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/3052955861473397216
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/3052955861473397216`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id/1894556283169218235
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id/1894556283169218235`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/pending
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/pending`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/pending/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/pending/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor/3651945078010658771
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor/3651945078010658771`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor/slots%3Fdate=date
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor/slots (date)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor/slots/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor/slots/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/head-transfers
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/head-transfers`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/1301595754986702137
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/1301595754986702137`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/pending
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/pending`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/pending/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/pending/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/7659861559475012447
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/7659861559475012447`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/5892710264857130809
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/5892710264857130809`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/join-requests%3Fstatus=status
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/join-requests (status)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/join-requests/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/join-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/members%3Fpage=1&pageSize=20&search=ZAP
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/members (page,pageSize,search)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/members/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/roster
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/roster`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/roster/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/roster/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/triage-cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/triage-cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/triage-cases/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/8124761474600124973
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/8124761474600124973`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/5106897564986512741
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/5106897564986512741`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/invitations
  * Node Name: `http://host.docker.internal:5060/api/v1/families/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/invitations/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/invitations/2628419931904366389
  * Node Name: `http://host.docker.internal:5060/api/v1/families/invitations/2628419931904366389`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/8320692060670683681
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/8320692060670683681`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/id
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/id/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/id/7141936719368060283
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/id/7141936719368060283`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/me/2716485357488534471
  * Node Name: `http://host.docker.internal:5060/api/v1/families/me/2716485357488534471`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/family-head
  * Node Name: `http://host.docker.internal:5060/api/v1/family-head`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/family-head/
  * Node Name: `http://host.docker.internal:5060/api/v1/family-head/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/family-head/6922139867190050021
  * Node Name: `http://host.docker.internal:5060/api/v1/family-head/6922139867190050021`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/1914169918550636084
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/1914169918550636084`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/invitationId
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/invitationId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/invitationId/
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/invitationId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/invitationId/4251195036995232593
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/invitationId/4251195036995232593`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/6390573936630280425
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/6390573936630280425`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/4017468348234279405
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/4017468348234279405`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/file
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/file`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/file/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/file/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members
  * Node Name: `http://host.docker.internal:5060/api/v1/members`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/4540066715391148113
  * Node Name: `http://host.docker.internal:5060/api/v1/members/4540066715391148113`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/2627002975059360341
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/2627002975059360341`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/consents
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/consents`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/consents/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/consents/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/consents/2371288815709997010
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/consents/2371288815709997010`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/episodes%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/episodes (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/episodes/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/episodes/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/familial-risk
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/familial-risk`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/familial-risk/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/familial-risk/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/hereditary-flags
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/hereditary-flags`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/hereditary-flags/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/hereditary-flags/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/lab-reports`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/3218266666855117967
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/3218266666855117967`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/deleted
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/deleted`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/deleted/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/deleted/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/records%3Fpage=1&pageSize=20&search=ZAP&type=Condition&sort=newest
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/records (page,pageSize,search,sort,type)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/records/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/records/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/relationships
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/relationships`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/relationships/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/relationships/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/triage-cases%3Fpage=1&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/triage-cases (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/triage-cases/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/vitals
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/vitals`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/vitals/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/vitals/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/vitals/93000280979066731
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/vitals/93000280979066731`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/vitals/trends
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/vitals/trends`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/vitals/trends/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/vitals/trends/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications%3FunreadOnly=http%253A%252F%252Fwww.google.com%252F
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications (unreadOnly)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/728992775927815841
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/728992775927815841`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/id
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/id`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/id/
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/id/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/id/8958324054687315690
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/id/8958324054687315690`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/inbox%3Fpage=http%253A%252F%252Fwww.google.com%252F&pageSize=20
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/inbox (page,pageSize)`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/profile
  * Node Name: `http://host.docker.internal:5060/api/v1/profile`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/profile/
  * Node Name: `http://host.docker.internal:5060/api/v1/profile/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/profile/1203685401036977626
  * Node Name: `http://host.docker.internal:5060/api/v1/profile/1203685401036977626`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records
  * Node Name: `http://host.docker.internal:5060/api/v1/records`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/
  * Node Name: `http://host.docker.internal:5060/api/v1/records/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/2521686562174545558
  * Node Name: `http://host.docker.internal:5060/api/v1/records/2521686562174545558`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `405`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId/4390528701101229209
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId/4390528701101229209`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/4967313709850279853
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/4967313709850279853`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/3771176209846278331
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/3771176209846278331`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/approved-guidance
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/approved-guidance`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/approved-guidance/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/approved-guidance/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/review
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/review`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/review/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/review/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/status
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/status`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/status/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/status/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/traces
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/traces`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/traces/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/traces/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/swagger/2321882792350200571
  * Node Name: `http://host.docker.internal:5060/swagger/2321882792350200571`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/swagger/v1
  * Node Name: `http://host.docker.internal:5060/swagger/v1`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/swagger/v1/
  * Node Name: `http://host.docker.internal:5060/swagger/v1/`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/swagger/v1/5153455320616767982
  * Node Name: `http://host.docker.internal:5060/swagger/v1/5153455320616767982`
  * Method: `GET`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/sharing
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/sharing ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/sharing/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/sharing/ ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId/sharing
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId/sharing ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId/sharing/
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId/sharing/ ()({sharedWithFamilyHead})`
  * Method: `PATCH`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/reject
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/reject ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/reject/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/reject/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/request-info
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/request-info ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/request-info/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/request-info/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/suspend
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/suspend ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/suspend/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/suspend/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/verification
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/verification ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/verification/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/verification/ ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/verify
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/verify ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/verify/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/doctors/doctorId/verify/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/reject
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/reject ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/reject/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/reject/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/request-info
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/request-info ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/request-info/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/request-info/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/suspend
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/suspend ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/suspend/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/suspend/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/verification
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/verification ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/verification/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/verification/ ()({status,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/verify
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/verify ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/admin/family-heads/userId/verify/
  * Node Name: `http://host.docker.internal:5060/api/v1/admin/family-heads/userId/verify/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments ()({memberId,startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/ ()({memberId,startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/id/cancel/
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/id/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/userId/reset-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/userId/reset-password ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/userId/reset-password/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/userId/reset-password/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/userId/toggle-status
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/userId/toggle-status ()({isActive,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/admin/users/userId/toggle-status/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/admin/users/userId/toggle-status/ ()({isActive,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/change-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/change-password ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/change-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/change-password ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/change-password/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/change-password/ ()({currentPassword,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/forgot-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/forgot-password ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/forgot-password/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/forgot-password/ ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/login ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/login/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/login/ ()({email,password})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/logout/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/logout/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/refresh
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/refresh ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/refresh
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/refresh ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/refresh/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/refresh/ ()({refreshToken})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/ ()({email,password,displayName,userType,nic,address,registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/adult-member
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/adult-member ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/adult-member
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/adult-member ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/adult-member/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/adult-member/ ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},address:{addressLine1,addressLine2,city,district,postalCode},connection:{method,invitationToken,familyCode,relationship},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/doctor
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/doctor ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/doctor
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/doctor ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/doctor/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/doctor/ ()(multipart:FullName,Email,MobileNumber,Password,ConfirmPassword,RegistrationNumber,Specialization,HospitalClinic,PracticeCity,District,Languages,AcceptTerms,LicenseDocument)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/family-head
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/family-head ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/family-head
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/family-head ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/register/family-head/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/register/family-head/ ()({account:{fullName,email,mobileNumber,password,confirmPassword},personal:{dateOfBirth,sexForClinicalReference},familyName,nationalId,address:{addressLine1,addressLine2,city,district,postalCode},acceptTerms})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/auth/reset-password/
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/reset-password/ ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/cancel ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/cancel/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/cancel/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/complete
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/complete ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/complete/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/complete/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/confirm
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/confirm ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/confirm/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/confirm/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/no-show
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/no-show ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/no-show/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/no-show/ ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/reschedule
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/reschedule ()({startsAt,note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/reschedule/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/reschedule/ ()({startsAt,note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/blocked-time
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/blocked-time ()({startsAt,endsAt,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/blocked-time/ ()({startsAt,endsAt,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/accept
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/accept/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/decline
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/decline/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/family-requests/id/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/notes
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/notes ()({content,noteType,appointmentId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/notes/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/members/memberId/notes/ ()({content,noteType,appointmentId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId/amend
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId/amend ()({content})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId/amend/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/notes/noteId/amend/ ()({content})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/register
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/register ()({registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/register/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/register/ ()({registrationNumber,specialty,hospitalClinic,phoneNumber})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/episodes/episodeId/triage
  * Node Name: `http://host.docker.internal:5060/api/v1/episodes/episodeId/triage`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/episodes/episodeId/triage/
  * Node Name: `http://host.docker.internal:5060/api/v1/episodes/episodeId/triage/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families
  * Node Name: `http://host.docker.internal:5060/api/v1/families ()({name})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families
  * Node Name: `http://host.docker.internal:5060/api/v1/families ()({name})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/ ()({name})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests ()({doctorId,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/ ()({doctorId,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id/cancel
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id/cancel/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/doctor-requests/id/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/head-transfers
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/head-transfers ()({toMemberId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/head-transfers/ ()({toMemberId})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations ()({email,relationshipType})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/ ()({email,relationshipType})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/cancel
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/cancel/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/resend
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/resend ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/resend/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/invitations/invitationId/resend/ ()({email})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/members
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/members ()({displayName,dateOfBirth,role,userId,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/members/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/members/ ()({displayName,dateOfBirth,role,userId,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/accept
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/accept/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/cancel
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/cancel/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/cancel/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/decline
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/decline/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/head-transfers/transferId/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/invitations/accept
  * Node Name: `http://host.docker.internal:5060/api/v1/families/invitations/accept ()({token,dateOfBirth,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/invitations/accept
  * Node Name: `http://host.docker.internal:5060/api/v1/families/invitations/accept ()({token,dateOfBirth,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/invitations/accept/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/invitations/accept/ ()({token,dateOfBirth,sexForClinicalReference})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/ ()({familyCode,relationshipType,message})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `429`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/id/accept
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/id/accept`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/id/accept/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/id/accept/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/id/decline
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/id/decline`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/join-requests/id/decline/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/join-requests/id/decline/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/me/leave
  * Node Name: `http://host.docker.internal:5060/api/v1/families/me/leave ()({startOwnFamily})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/me/leave/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/me/leave/ ()({startOwnFamily})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `409`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/invitationId/approve
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/invitationId/approve`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/invitationId/approve/
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/invitationId/approve/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/invitationId/reject
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/invitationId/reject`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/invitations/invitationId/reject/
  * Node Name: `http://host.docker.internal:5060/api/v1/invitations/invitationId/reject/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/extract
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/extract`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/extract/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/extract/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/restore
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/restore`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/restore/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/restore/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/consents/reaffirm
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/consents/reaffirm`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/consents/reaffirm/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/consents/reaffirm/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/episodes
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/episodes ()({symptoms:[],durationDays,severity,notes})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/episodes/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/episodes/ ()({symptoms:[],durationDays,severity,notes})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/lab-reports ()(multipart:File,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/lab-reports
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/lab-reports ()(multipart:rtobject,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/lab-reports/ ()(multipart:File,CollectedAt)`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/records
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/records ()({recordType,title,summary,occurredOn})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/records/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/records/ ()({recordType,title,summary,occurredOn})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/relationships
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/relationships ()({relatedMemberId,relationshipType,isBiological})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/relationships/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/relationships/ ()({relatedMemberId,relationshipType,isBiological})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/remove-from-family
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/remove-from-family`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/remove-from-family/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/remove-from-family/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/vitals
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/vitals ()({vitalType,value,unit,measuredAt})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/vitals/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/vitals/ ()({vitalType,value,unit,measuredAt})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/id/read
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/id/read`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/id/read/
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/id/read/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/subscribe
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/subscribe ()({deviceToken,platform})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/notifications/subscribe/
  * Node Name: `http://host.docker.internal:5060/api/v1/notifications/subscribe/ ()({deviceToken,platform})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/appointments
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/appointments ()({startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/appointments/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/appointments/ ()({startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/approve
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/approve ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/approve/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/approve/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/claim
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/claim`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/claim/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/claim/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/close-referral
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/close-referral`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/close-referral/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/close-referral/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/decision
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/decision ()({action,doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/decision/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/decision/ ()({action,doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/escalate
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/escalate ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/escalate/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/escalate/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/reject
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/reject ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/reject/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/reject/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/request-info
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/request-info ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/request-info/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/request-info/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/revise
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/revise ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/revise/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/revise/ ()({doctorNotes,finalAdvisory})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/share-contact
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/share-contact`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/share-contact/
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/share-contact/`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/computeMetadata/v1/
  * Node Name: `http://host.docker.internal:5060/computeMetadata/v1/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/latest/meta-data/
  * Node Name: `http://host.docker.internal:5060/latest/meta-data/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/metadata/instance
  * Node Name: `http://host.docker.internal:5060/metadata/instance ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/metadata/v1
  * Node Name: `http://host.docker.internal:5060/metadata/v1 ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/opc/v1/instance/
  * Node Name: `http://host.docker.internal:5060/opc/v1/instance/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/opc/v2/instance/
  * Node Name: `http://host.docker.internal:5060/opc/v2/instance/ ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/openstack/latest/meta_data.json
  * Node Name: `http://host.docker.internal:5060/openstack/latest/meta_data.json ()({reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/availability
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/availability ()({windows:[{dayOfWeek,startTime,endTime}]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/availability/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/availability/ ()({windows:[{dayOfWeek,startTime,endTime}]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/profile
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/profile ()({specialty,clinic,phoneNumber,district,city,languages,consultationModes,acceptingNewFamilies,slotMinutes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/profile/
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/profile/ ()({specialty,clinic,phoneNumber,district,city,languages,consultationModes,acceptingNewFamilies,slotMinutes})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `403`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId ()({name})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/families/familyId/
  * Node Name: `http://host.docker.internal:5060/api/v1/families/familyId/ ()({name})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/review
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/review ()({values:[{id,analyte,value,unit,referenceLow,referenceHigh}],confirmedFlagIds:[]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/lab-reports/reportId/review/
  * Node Name: `http://host.docker.internal:5060/api/v1/lab-reports/reportId/review/ ()({values:[{id,analyte,value,unit,referenceLow,referenceHigh}],confirmedFlagIds:[]})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId ()({displayName,dateOfBirth,role,sexForClinicalReference})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/ ()({displayName,dateOfBirth,role,sexForClinicalReference})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/consents/HereditaryFlags
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/consents/HereditaryFlags ()({status})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/members/memberId/consents/HereditaryFlags/
  * Node Name: `http://host.docker.internal:5060/api/v1/members/memberId/consents/HereditaryFlags/ ()({status})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/profile/me
  * Node Name: `http://host.docker.internal:5060/api/v1/profile/me ()({displayName})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `400`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId ()({recordType,title,summary,occurredOn})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/records/recordId/
  * Node Name: `http://host.docker.internal:5060/api/v1/records/recordId/ ()({recordType,title,summary,occurredOn})`
  * Method: `PUT`
  * Parameter: ``
  * Attack: ``
  * Evidence: `404`
  * Other Info: ``


Instances: 450

### Solution



### Reference



#### CWE Id: [ 388 ](https://cwe.mitre.org/data/definitions/388.html)


#### WASC Id: 20

#### Source ID: 4

### [ Authentication Request Identified ](https://www.zaproxy.org/docs/alerts/10111/)



##### Informational (High)

### Description

The given request has been identified as an authentication request. The 'Other Info' field contains a set of key=value lines which identify any relevant fields. If the request is in a context which has an Authentication Method set to "Auto-Detect" then this rule will change the authentication to match the request identified.

* URL: http://host.docker.internal:5060/api/v1/auth/reset-password
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/reset-password ()({email,token,newPassword})`
  * Method: `POST`
  * Parameter: `email`
  * Attack: ``
  * Evidence: `newPassword`
  * Other Info: `userParam=email
userValue=zaproxy@example.com
passwordParam=newPassword`
* URL: http://host.docker.internal:5060/api/v1/auth/login
  * Node Name: `http://host.docker.internal:5060/api/v1/auth/login ()({email,password})`
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

* URL: http://host.docker.internal:5060/api/v1/appointments
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments ()({memberId,startsAt,durationMinutes,reason})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/appointments/id/cancel
  * Node Name: `http://host.docker.internal:5060/api/v1/appointments/id/cancel`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/confirm
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/confirm ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/no-show
  * Node Name: `http://host.docker.internal:5060/api/v1/doctors/me/appointments/id/no-show ()({note})`
  * Method: `POST`
  * Parameter: ``
  * Attack: ``
  * Evidence: `authorization:`
  * Other Info: ``
* URL: http://host.docker.internal:5060/api/v1/triage-cases/caseId/appointments
  * Node Name: `http://host.docker.internal:5060/api/v1/triage-cases/caseId/appointments ()({startsAt,durationMinutes,reason})`
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


