import React, { Component } from 'react';
import Papa from 'papaparse';

class Banner extends Component {

    constructor(props) {
        super(props);
        this.state = { loading: false };
    }

    handleFileChange = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        this.setState({ loading: true });

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const data = results.data;
                var filterDate = document.getElementById("filterDate").value;

                if (filterDate.length > 1) {
                    var tempArray = [];
                    for (var i = 0; i < data.length; i++) {
                        if (data[i]["Event End Timestamp"] >= filterDate + "T00:00:00" || data[i]["Event Start Timestamp"] >= filterDate + "T00:00:00") {
                            tempArray.push(data[i]);
                        }
                    }
                    this.props.dataResponseHandler(tempArray);
                } else {
                    this.props.dataResponseHandler(data);
                }

                this.setState({ loading: false });
            },
            error: (err) => {
                this.setState({ loading: false });
                alert('Error Occured\n\n' + err.message + '\n\n Please contact @samthegeek on twitter for more help.');
            }
        });
    }


    render() {

        return (
            <div>
                <section className="hero">
                    <h1 className="display-3">Apple Music Analyser</h1>
                    <p className="lead">Open your <em>Apple Music Play Activity.csv</em> file below to generate your report.</p>
                    <hr className="my-2" />
                    <p>No data ever leaves your computer and all computation is done in the browser.</p>
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <p>If you want to specify the start of the report, such as to only include 2021, input 01-01-2021 below. Otherwise, if you leave it blank it will generate the report based on all the data in the Apple Music Play Activity.csv file. </p>
                            Choose date: <input id="filterDate" type="date" />
                        </div>
                        <input
                            id="file"
                            name="file"
                            className="inputfile"
                            type="file"
                            accept=".csv"
                            onChange={this.handleFileChange}
                        />
                        <p>{this.state.loading ? 'Loading may take a moment... be patient' : 'Choose your CSV file to start'}</p>
                    </div>

                </section>

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
