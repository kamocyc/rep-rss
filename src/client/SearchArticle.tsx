import React from "react";
import { Form, Row, Col, Button, Container, Navbar, Nav, FormControl } from 'react-bootstrap';

interface SearchArticleProps {}
interface SearchArticleStates {
  query: string  
}

class SearchArticle extends React.Component<SearchArticleProps, SearchArticleStates> {
  constructor(props: SearchArticleProps) {
    super(props);
    
    this.state = {
      query: ""  
    };
  }
  
  handleSubmit = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    
    alert(this.state.query);
  }
  
  handleChange = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    this.setState({query: e.target.value});
  }
  
  render() {
    return (
      <Form onSubmit={this.handleSubmit} inline>
        <Form.Group as={Row} controlId="searchControlGroup">
          <Col sm={10}>
            <Form.Control type="text" placeholder="search keywords" value={this.state.query} onChange={this.handleChange} />
          </Col>
          <Col sm={2}>
            <Button type="submit">Search</Button>
          </Col>
        </Form.Group>
      </Form>);
  }
}

export default SearchArticle;
