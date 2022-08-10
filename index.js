const express = require('express')
const https = require('https');
const fs = require('fs')
// const path = require('path')
const mp4Url = 'https://www.expensify.com/chat-attachments/993313808/w_236f82a249530209a1b5f30d479895a9e62c90b1.mp4?encryptedAuthToken=GOgjpORaSwZh%2B7y3pE%2Bszy7BDr3Lp1xYeGom5UUUnH5ADOm7LzZPBmZl6XGv5j9h2auwSLKb9wfDvEcCECdWAdMOsmJCrQqZ45ebGC%2FGxiINBTn3dmhYxS7smNVqHZCwxn47P%2F4swVcZk0Z%2B2ZqIAboNeVbMgVDYi7NTJoDb2Tk9GoFbbOkgLvfUclpBqZLFFHxyXe9jrLmnYvwS8tMwR9TDyfXA%2BMOh3Uw48bh9Kcdx8TxP%2BwD9JG5R2QPh%2Bhn4Cw3J8%2FtH9T4WUcs1rCwpzi1YiUgmlS39Md70f%2B%2FZqItSUkamfNcXiqsx7iDrHz5ak3wvq6Xzw071rKMI9vpzAo5QvIp5Qvy2wuVUMzBkP4VUJ7ekfi1MhwIOc2Ube1NTtb1gUYxuIY2eHgeFLcaYhXOf9HpkzFMT86zXCE8kzCtmELOlq9nNHrgJmVHjp6I5DuefW%2FTPgxoOk0vz0okY7FhrbJKkVtdWklmKQjLuK5%2FnGOAvvItyHWYHpjhNRUu644rlKxuArrQ%2Fs5b9RNNV7HYc87kR3FzskckkekV%2B98Ku21PSbJ5PtWWAx5Rtd%2BqFpn7y0VcnfJiqUcSr%2Bn9tcxJgZRIDiYRaYzr%2FFLqgV4jPcue12Bb36wd4UxJ00%2FmdDROoCw9YgGPIa5yYh0%2Fi9bC3UUvH3aJWUtgLiKeFhHsrzxPJtflAk2SVqc%2Bid39n3Wh3X3q%2F2JWfpMZ%2FWoEO28waGwcfbHVsrxSXtPHamh8TNKb0DGo4wfmBc%2FV75cSJC%2Bmdi3kLe%2FznensIcG3pk7suFFc2h3GyJqUFxml3GEn2kAymvnZUgUtuuVd8YWIe5QTbbfhLlmCBsBVqCwARef1vBANWC4Jtsc7Fghj%2Bm0bFfSRwZgN1a%2BTx73S7Cqmcye460gqwNNrhTg3GzI6sG%2F%2BBcBUixQ3z45V7u9cvycDbH%2B7qTZWqtx9gvY7LLo%2FfKS73uRfHnHDm3R6QIdQ3Dg%3D%3D';
const app = express()
const port = process.env.PORT || 3000

const download = (uri, fileName, cb)=>{
    if(fs.stat(fileName, function(err, state){
        if(state){
            console.log('file is exist')
            return;
        }
        console.log('file not exist');
        const file = fs.createWriteStream(fileName);
        const request = https.get(uri, function(response) {
            response.pipe(file);
         
            // after download completed close filestream
            file.on("finish", () => {
                file.close();
                console.log("Download Completed");
                cb()
                // return;
            });
         });
    }))
    return;
}


app.get("/video", function (req, res) {
    const {uri} = req.query;
    // console.log('uri :',uri)
    const encodedUri = uri.split('encryptedAuthToken=')[0] + "encryptedAuthToken=" + encodeURIComponent(uri.split('encryptedAuthToken=')[1])
    const fileName = uri.split('?')[0].split('w_')[1];
    console.log('encode uri :',encodedUri)
    https.get(encodedUri, (stream) => {
        stream.pipe(res);
    });
});


app.get('/video2', async (req, res) => {
    const {uri} = req.query;
    const encodedUri = uri.split('encryptedAuthToken=')[0] + "encryptedAuthToken=" + encodeURIComponent(uri.split('encryptedAuthToken=')[1])
    const fileName = uri.split('?')[0].split('w_')[1];

    download(encodedUri, fileName, ()=>{
        let filePath = fileName;
        // Listing 3.
        const options = {};
    
        let start;
        let end;
    
        const range = req.headers.range;
        if (range) {
            const bytesPrefix = "bytes=";
            if (range.startsWith(bytesPrefix)) {
                const bytesRange = range.substring(bytesPrefix.length);
                const parts = bytesRange.split("-");
                if (parts.length === 2) {
                    const rangeStart = parts[0] && parts[0].trim();
                    if (rangeStart && rangeStart.length > 0) {
                        options.start = start = parseInt(rangeStart);
                    }
                    const rangeEnd = parts[1] && parts[1].trim();
                    if (rangeEnd && rangeEnd.length > 0) {
                        options.end = end = parseInt(rangeEnd);
                    }
                }
            }
        }
    
        res.setHeader("content-type", "video/mp4");
    
        fs.stat(filePath, (err, stat) => {
            if (err) {
                console.error(`File stat error for ${filePath}.`);
                console.error(err);
                res.sendStatus(500);
                return;
            }
    
            let contentLength = stat.size;
    
            // Listing 4.
            if (req.method === "HEAD") {
                res.statusCode = 200;
                res.setHeader("accept-ranges", "bytes");
                res.setHeader("content-length", contentLength);
                res.end();
            }
            else {       
                // Listing 5.
                let retrievedLength;
                if (start !== undefined && end !== undefined) {
                    retrievedLength = (end+1) - start;
                }
                else if (start !== undefined) {
                    retrievedLength = contentLength - start;
                }
                else if (end !== undefined) {
                    retrievedLength = (end+1);
                }
                else {
                    retrievedLength = contentLength;
                }
    
                // Listing 6.
                res.statusCode = start !== undefined || end !== undefined ? 206 : 200;
    
                res.setHeader("content-length", retrievedLength);
    
                if (range !== undefined) {  
                    res.setHeader("content-range", `bytes ${start || 0}-${end || (contentLength-1)}/${contentLength}`);
                    res.setHeader("accept-ranges", "bytes");
                }
    
                // Listing 7.
                const fileStream = fs.createReadStream(filePath, options);
                fileStream.on("error", error => {
                    console.log(`Error reading file ${filePath}.`);
                    console.log(error);
                    res.sendStatus(500);
                });
    
    
                fileStream.pipe(res);
            }
    })
    // let filePath='file3.mp4'
    // // Listing 3.
    // const options = {};

    // let start;
    // let end;

    // const range = req.headers.range;
    // if (range) {
    //     const bytesPrefix = "bytes=";
    //     if (range.startsWith(bytesPrefix)) {
    //         const bytesRange = range.substring(bytesPrefix.length);
    //         const parts = bytesRange.split("-");
    //         if (parts.length === 2) {
    //             const rangeStart = parts[0] && parts[0].trim();
    //             if (rangeStart && rangeStart.length > 0) {
    //                 options.start = start = parseInt(rangeStart);
    //             }
    //             const rangeEnd = parts[1] && parts[1].trim();
    //             if (rangeEnd && rangeEnd.length > 0) {
    //                 options.end = end = parseInt(rangeEnd);
    //             }
    //         }
    //     }
    // }

    // res.setHeader("content-type", "video/mp4");

    // fs.stat(filePath, (err, stat) => {
    //     if (err) {
    //         console.error(`File stat error for ${filePath}.`);
    //         console.error(err);
    //         res.sendStatus(500);
    //         return;
    //     }

    //     let contentLength = stat.size;

    //     // Listing 4.
    //     if (req.method === "HEAD") {
    //         res.statusCode = 200;
    //         res.setHeader("accept-ranges", "bytes");
    //         res.setHeader("content-length", contentLength);
    //         res.end();
    //     }
    //     else {       
    //         // Listing 5.
    //         let retrievedLength;
    //         if (start !== undefined && end !== undefined) {
    //             retrievedLength = (end+1) - start;
    //         }
    //         else if (start !== undefined) {
    //             retrievedLength = contentLength - start;
    //         }
    //         else if (end !== undefined) {
    //             retrievedLength = (end+1);
    //         }
    //         else {
    //             retrievedLength = contentLength;
    //         }

    //         // Listing 6.
    //         res.statusCode = start !== undefined || end !== undefined ? 206 : 200;

    //         res.setHeader("content-length", retrievedLength);

    //         if (range !== undefined) {  
    //             res.setHeader("content-range", `bytes ${start || 0}-${end || (contentLength-1)}/${contentLength}`);
    //             res.setHeader("accept-ranges", "bytes");
    //         }

    //         // Listing 7.
    //         const fileStream = fs.createReadStream(filePath, options);
    //         fileStream.on("error", error => {
    //             console.log(`Error reading file ${filePath}.`);
    //             console.log(error);
    //             res.sendStatus(500);
    //         });


    //         fileStream.pipe(res);
    //     }
    });

    setTimeout( () => {
        console.log('we gonna remove file :', fileName, 'now.')
        fs.rm(fileName, ()=>{})
    } ,20000);

    // let filePath='file2.mp4'
    // // Listing 3.
    // const options = {};

    // let start;
    // let end;

    // const range = req.headers.range;
    // if (range) {
    //     const bytesPrefix = "bytes=";
    //     if (range.startsWith(bytesPrefix)) {
    //         const bytesRange = range.substring(bytesPrefix.length);
    //         const parts = bytesRange.split("-");
    //         if (parts.length === 2) {
    //             const rangeStart = parts[0] && parts[0].trim();
    //             if (rangeStart && rangeStart.length > 0) {
    //                 options.start = start = parseInt(rangeStart);
    //             }
    //             const rangeEnd = parts[1] && parts[1].trim();
    //             if (rangeEnd && rangeEnd.length > 0) {
    //                 options.end = end = parseInt(rangeEnd);
    //             }
    //         }
    //     }
    // }

    // res.setHeader("content-type", "video/mp4");

    // fs.stat(filePath, (err, stat) => {
    //     if (err) {
    //         console.error(`File stat error for ${filePath}.`);
    //         console.error(err);
    //         res.sendStatus(500);
    //         return;
    //     }

    //     let contentLength = stat.size;

    //     // Listing 4.
    //     if (req.method === "HEAD") {
    //         res.statusCode = 200;
    //         res.setHeader("accept-ranges", "bytes");
    //         res.setHeader("content-length", contentLength);
    //         res.end();
    //     }
    //     else {       
    //         // Listing 5.
    //         let retrievedLength;
    //         if (start !== undefined && end !== undefined) {
    //             retrievedLength = (end+1) - start;
    //         }
    //         else if (start !== undefined) {
    //             retrievedLength = contentLength - start;
    //         }
    //         else if (end !== undefined) {
    //             retrievedLength = (end+1);
    //         }
    //         else {
    //             retrievedLength = contentLength;
    //         }

    //         // Listing 6.
    //         res.statusCode = start !== undefined || end !== undefined ? 206 : 200;

    //         res.setHeader("content-length", retrievedLength);

    //         if (range !== undefined) {  
    //             res.setHeader("content-range", `bytes ${start || 0}-${end || (contentLength-1)}/${contentLength}`);
    //             res.setHeader("accept-ranges", "bytes");
    //         }

    //         // Listing 7.
    //         const fileStream = fs.createReadStream(filePath, options);
    //         fileStream.on("error", error => {
    //             console.log(`Error reading file ${filePath}.`);
    //             console.log(error);
    //             res.sendStatus(500);
    //         });


    //         fileStream.pipe(res);
    //     }
    // });
});

app.listen(port,()=>{
    console.log('server started!!')
})
// https://us-central1-track-307120.cloudfunctions.net/expensify_video-1
// https://us-central1-track-307120.cloudfunctions.net/expensify_video



    // https://us-central1-track-307120.cloudfunctions.net/expensify_video
