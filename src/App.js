import React, {Component} from 'react';
import { ApolloClient, createNetworkInterface, gql } from 'react-apollo';
import { Grid, Row, Col } from 'react-flexbox-grid';
// import {Container, Row, Col, Button} from 'react-bootstrap';
import './App.css';

class App extends Component {

    constructor(props){

        super(props);

        //initial state
        this.state = {
            loaded: false,
            solved: false,
            totalObjects: null,
            maasObject: null
        }

        //bindings
        this.startNewPuzzle = this.startNewPuzzle.bind(this);
        this.fetchRandomObject = this.fetchRandomObject.bind(this);
        this.puzzleSolved = this.puzzleSolved.bind(this);

        //puzzle defaults
        window.puzzlePieces.defaultMixed = true;
        window.puzzlePieces.defaultSimple = true;
        window.puzzlePieces.defaultLevel = 0;
        window.puzzlePieces.defaultPolygon = true;
        window.puzzlePieces.defaultMatchcolor   = '#e30066';
        window.puzzlePieces.defaultFalsecolor   = '';
        window.puzzlePieces.defaultAreacolor    = '#e0e0e0';
        window.puzzlePieces.defaultBgrndcolor   = '#000000';
        window.puzzlePieces.defaultBorderwide = 5;
        window.puzzlePieces.defaultAreaopacity  = 0;
        window.puzzlePieces.defaultBorderopacity= 0.2;
        window.puzzlePieces.defaultShadowopacity= 0.3;
        window.puzzlePieces.defaultCallback = () => {
            this.puzzleSolved();
        }

    }

    //on init
    componentWillMount() {

        //get total number of objects in collection for randomization
        maasApiClient.query({query: gql `
            query objectTotal {
                objectTotal
            }
        `}).then(response => {

            this.setState({
                totalObjects: response.data.objectTotal
            });

            //start new game
            this.startNewPuzzle();

        }).catch(error => console.error(error));

    }

    //on new game
    startNewPuzzle(){

        //fetch a random object from the collection
        this.fetchRandomObject();

    }

    fetchRandomObject(){

        //random number of total objects to skip to
        let randomSkip = Math.floor(Math.random() * this.state.totalObjects - 1) + 0;

        //query a random object from the maas api using random skip number based off total
        maasApiClient.query({
            query: gql `query maasAssessment($randomSkip: Int) {
                objects(limit:1, skip: $randomSkip) {
                    title
                    summary
                    mainImage {
                        url
                    }
                    images {
                        url
                    }
                }
            }`,
            variables: {
                randomSkip: randomSkip
            }
        }).then(response => {

            console.log(response);
            if ( response.data.objects[0] &&
                response.data.objects[0].title &&
                response.data.objects[0].summary &&
                response.data.objects[0].mainImage &&
                response.data.objects[0].mainImage.url ) {

                console.log('object found');

                let puzzleImg = document.getElementById('puzzle-image');

                puzzleImg.onload = () => {
                    window.puzzlePieces.add(puzzleImg);

                    // solve it for me
                    //window.puzzlePieces.solve(document.getElementById('puzzle-image'));

                    //this.puzzleSolved();

                }

                this.setState({
                    maasObject: response.data.objects[0]
                });

            } else {
                //no object was found or object did not include a main image
                //fetch another object
                this.fetchRandomObject();
            }

        }).catch(error => console.error(error));

    }

    puzzleSolved(){
        console.log('puzzle solved');

        //window.puzzlePieces.solve(document.getElementById('puzzle-image'));

        this.setState({
            solved: true
        })
    }

    render() {

        let puzzlePush = this.state.solved ? 0 : 2;
        let puzzleWidth = this.state.solved ? 6 : 8;

        return (
            <div className="App">

                <div className="container">

                    <h1>MAAS Object Discoverer</h1>

                    <p>
                        Put the pieces together and help uncover assorted objects from the MAAS collection.
                    </p>

                    <div className={`game-area ${this.state.solved ? 'solved' : null}`}>
                        <Row>
                            <Col xs={puzzleWidth} xsOffset={puzzlePush} className="puzzle-col">
                                <div className="puzzle-container">
                                    <img id="puzzle-image" width="100%" src={this.state.maasObject ? this.state.maasObject.mainImage.url : null} alt="Puzzle"/>
                                    <img id="puzzle-solved" width="100%" src={this.state.maasObject ? this.state.maasObject.mainImage.url : null} alt="Puzzle"/>
                                </div>
                            </Col>
                            <Col xs={6} className="object-details">
                                <div className="object-title">
                                    {this.state.maasObject ? this.state.maasObject.title : null}
                                </div>
                            </Col>
                        </Row>
                    </div>

                </div>

            </div>
        );
    }

}

//register an apollo client to connect with maas graphql api
const maasApiClient = new ApolloClient({
    networkInterface: createNetworkInterface({uri: 'https://api.maas.museum/graphql'})
});

export default App;
