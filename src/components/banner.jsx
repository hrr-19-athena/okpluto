"use strict";

import React from 'react';

const Banner = (props) => {
  if (props.profileType === "DogProfile") {
    return (
    <div className="rentalBanner">
      <h1>{"Hi, I'm " + props.display}</h1>
    </div>
    )
  } else if (props.profileType === "rental") {
    return (
      <div className="rentalBanner">
        <h1>{props.display}</h1>
      </div>
    )
  } else {
    return (
      <div className="banner">
        <h1>{props.display}</h1>
      </div>
    )
  }
}

module.exports = Banner;