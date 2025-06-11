from mcp.server.fastmcp import FastMCP

mcp = FastMCP("ProductManager", stateless_http=True, json_response=True)

# Armazena os produtos como um dicionário {id: {...}}
products = {}

@mcp.tool()
def create_product(id: str, name: str, description: str, price: int):
    """Create a product"""

    if id in products:
        return {"error": "Produto já existe"}
    products[id] = {
        "name": name,
        "description": description,
        "price": price
    }
    return {"status": "Produto cadastrado", "product": products[id]}

@mcp.tool()
def delete_product(id: str):
    """Delete a product"""

    if id not in products:
        return {"error": "Produto não encontrado"}
    del products[id]
    return {"status": "Produto deletado"}

@mcp.tool()
def get_product(id: str):
    """Get a product"""

    if id not in products:
        return {"error": "Produto não encontrado"}
    return {"id": id, **products[id]}

@mcp.tool()
def count_products():
    """Count total a products"""

    return {"total": len(products)}

if __name__ == "__main__":
    mcp.run(transport="streamable-http")
