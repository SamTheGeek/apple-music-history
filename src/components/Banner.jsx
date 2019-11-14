import React, { Component } from 'react';
import { Jumbotron } from 'reactstrap';
import CsvParse from '@vtex/react-csv-parse';

const keys = [
    "Apple Id Number",
    "Apple Music Subscription",
    "Artist Name",
    "Build Version",
    "Client IP Address",
    "Content Name",
    "Content Provider",
    "Content Specific Type",
    "Device Identifier",
    "End Position In Milliseconds",
    "End Reason Type",
    "Event End Timestamp",
    "Event Reason Hint Type",
    "Event Received Timestamp",
    "Event Start Timestamp",
    "Event Type",
    "Feature Name",
    "Genre",
    "Item Type",
    "Media Duration In Milliseconds",
    "Media Type",
    "Metrics Bucket Id",
    "Metrics Client Id",
    "Milliseconds Since Play",
    "Offline",
    "Original Title",
    "Play Duration Milliseconds",
    "Source Type",
    "Start Position In Milliseconds",
    "Store Country Name",
    "UTC Offset In Seconds"
];

class Banner extends Component {

    constructor(props) {
        super(props);
        this.state = { loading: false };
    }



    render() {

        return (
            <div>
                <Jumbotron>
                    <h1 className="display-3">Apple Music Analyser</h1>
                    <p className="lead">Open your <em>Apple Music Play Activity.csv</em> file below to generate your report.</p>
                    <hr className="my-2" />
                    <p>No data ever leaves your computer and all computation is done in the browser.</p>
                    <CsvParse

                        keys={keys}
                        onDataUploaded={data => {

                            this.props.dataResponseHandler(data);

                        }}
                        onError={err => {

                            alert('Error Occured\n\n' + err.reason + '\n\n Please contact @samthegeek on twitter for more help.')

                        }}
                        render={onChange => <div><input id="file" name="file" className="inputfile" type="file" onChange={onChange} /><p>Loading may take a moment... be patient</p></div>}
                    />

                </Jumbotron>

                <div className="box">
                    <h3>Where is the file?</h3>

                    <p>After downloading it from the privacy portal (<a href="https://privacy.apple.com">privacy.apple.com</a>). The file is at:</p>
                    <pre>App Store, iTunes Store, iBooks Store and Apple Music/App_Store_iTunes_Store_iBooks_Store_Apple_Music/Apple Music Activity/Apple Music Play Activity.csv</pre>
                    <p><a href="https://www.macrumors.com/2018/11/29/web-app-apple-music-history/">Follow this tutorial from MacRumors for more detailed instructions.</a></p>
                    <a href="/step1.png"><img style={{ width: '300px' }} src={"/step1.png"} alt="" /></a>
                    <a href="/step2.png"><img style={{ width: '300px' }} src={"/step2.png"} alt="" /></a>
                    <a href="/step3.png"><img style={{ width: '300px' }} src={"/step3.png"} alt="" /></a>
                </div>

                <div className="box">
                    <h3>Example Screenshots</h3>
                    <a href="/image2.png"><img style={{ width: '300px' }} src={"/image2.png"} alt="" /></a>
                    <a href="/image1.png"><img style={{ width: '300px' }} src={"/image1.png"} alt="" /></a>
                    <a href="/image3.png"><img style={{ width: '300px' }} src={"/image3.png"} alt="" /></a>
                </div>


            </div>
        );

    }
}

export default Banner;
