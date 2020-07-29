import React, { useState } from "react";
import { Button, Col, Form, FormControl, Row } from 'react-bootstrap';

export const SearchArticle = () => {
  const [ query, setQuery ] = useState("");
  
  const handleSubmit = (e: React.FormEvent<HTMLElement>) => {
    e.preventDefault();
    
    alert(query);
  }
  
  const handleChange = (e: React.ChangeEvent<typeof FormControl & HTMLInputElement>) => {
    setQuery(e.target.value);
  }
  
  return (
    <Form onSubmit={handleSubmit} inline>
      <Form.Group as={Row} controlId="searchControlGroup">
        <Col sm={10}>
          <Form.Control type="text" placeholder="search keywords" value={query} onChange={handleChange} />
        </Col>
        <Col sm={2}>
          <Button type="submit">Search</Button>
        </Col>
      </Form.Group>
    </Form>);
};

