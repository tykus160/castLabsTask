# castLabs recruitment task
## by Wojciech Tyczyński (tyczynskiwojciech@gmail.com), June 2019

Solution based on vanilla ES8 Javascript. Tested on:

| Browser           | Version        | Passed  |
| ----------------- | --------------:| -------:|
| Mozilla Firefox   | 67.0.4         | &#9745; |
| Google Chrome     | 75.0.3770.100  | &#9745; |
| Microsoft Edge    | 44.18362.1.0   | &#9745; |
| Internet Explorer | 11.175.18362.0 | &#9744; |

Does not work on latest installment of Internet Explorer 11 due to really weak ES6 support.

**Bonus question:** Which problem can occur if the content of _mdat_ box is very large?

**Answer:** Solution implemented by me converts _mdat_ box to string using
```javascript
return String.fromCharCode.apply(null, uint8Array);
```
This approach has major downside - it can easily raise `RangeError` when there are more characters (>= 100k). It could be probably resolved by using
```javascript
return new TextDecoder("utf-8").decode(uint8Array);
```
However, `TextDecoder` is not implemented in Microsoft Edge. Moreover, even using `TextDecoder` javascript thread may stuck for really large blocks of text. I believe the best approach for this kind of problem would be to use `FileReader`, which offers asynchronous `onload` callback.