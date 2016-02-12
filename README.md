## BPM - Browser postMessage
a bidirectionnal iframe events manager

## Usage
### Developpement

Launch a dev server at **http://localhost:3000/** and watch for modifications:
```bash
$ gulp dev
```
Developpement files are located in **example/index.html** and **build/postmessage...**



### Distribution
prepare files for production in **dist** directory

```bash
$ gulp dist
```
Production files are located in **example/dist/index.html** and **dist/postmessage...**


## Library Usage

#### Initialize library:
```javascript
var pmInstance = bpm.initialize();
```
#### Add an iFrame by ID, create a **Frame** instance:
```javascript
var clientFrame = pmInstance.addFrame('myIframe');
```
####  **Frame** communication methods (chainable)
Send event
```javascript
clientFrame.send({
          name: 'clientFirstMessage',
          msg: 'client has something to say to frame 1'
      }, function(response){
           // handle response ...
      });
```

Listen event by event's name from child Frame:

```javascript
clientFrame.listenEventName('childFirstMessage', function(response){
     // handle response ...
});
```

Listen event by event's type from child Frame:

```javascript
clientFrame.listenEventType('childFirstMessage', function(response){
     // handle response ...
});
```
