import React, { Component } from 'react';
import YearCollapse from './yearcollapse';

class YearsTopSongs extends Component {

    render() {

        var yearsBoxes2 = [];
        for (let index = 0; index < this.props.years.length; index++) {
            const year = this.props.years[index];
            yearsBoxes2.push(<YearCollapse year={year} key={year.key + "-full"} />);
        }



        return (yearsBoxes2);

    }

}

export default YearsTopSongs;
