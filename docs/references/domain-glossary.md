# Domain Glossary

This document defines core domain terms used in the CHISAN Paper platform. All system development, database design, and user manual creation are based on this glossary.

## 1. Overview

### Purpose

- Establish a ubiquitous language for the CHISAN Paper business domain (Import, Inventory, Production, Distribution) across the company.
- Reduce communication errors between departments and ensure system data consistency.
- Provide training materials for new personnel and partners.

### Naming Conventions

- **Term**: Official name used in User Interface (UI) and reports.
- **Code**: Code used as database tables or system internal identifiers.

---

## 2. Product Terms

Terms related to the form and physical characteristics of paper products.

| Term                  | Code | Description                                                                              | Example                               |
| :-------------------- | :--- | :--------------------------------------------------------------------------------------- | :------------------------------------ |
| **Parent Roll**       | PR   | Huge roll produced and imported from paper mills. Raw material for slitting processing.  | 1000mm width art paper parent roll    |
| **Slitted Roll**      | SR   | Finished roll cut to narrow width according to customer specifications from parent roll. | 250mm width processed roll            |
| **Sheet**             | SH   | Paper cut into flat sheet form, not roll form.                                           | Standardized sheets like A4, B4       |
| **Grammage**          | -    | Weight per unit area of paper (g/m²). Indicates thickness and strength.                  | 80g/m², 150g/m²                       |
| **Width**             | -    | Horizontal width (mm) of roll paper. Standard dimension for slitting.                    | 1000mm, 625mm                         |
| **Diameter**          | -    | Outer diameter (mm) of roll product. Important for transport and loading.                | 1200mm                                |
| **Core**              | -    | Paper tube in the center where paper is wound. Inner diameter is important.              | 3-inch core, 6-inch core              |
| **Winding Direction** | -    | Direction in which paper is wound (IN: inside face out, OUT: outside face out).          | OUT direction winding                 |
| **Remnant**           | RM   | Raw material remaining after slitting work, reusable level.                              | 150mm width roll remaining after work |

---

## 3. Inventory Terms

Terms related to warehouse management and logistics flow.

| Term                | Description                                                                                        | Practical Tip                                     |
| :------------------ | :------------------------------------------------------------------------------------------------- | :------------------------------------------------ |
| **Stock-In**        | The act of inventory coming into the warehouse due to purchase, production completion, or returns. | Stock-in processing via barcode scan is mandatory |
| **Stock-Out**       | The act of inventory leaving the warehouse for sales, production input, or disposal.               | Recommended to follow FIFO principle              |
| **Stocktaking**     | The process of inspecting whether book inventory matches actual physical inventory.                | Perform regular stocktaking once a quarter        |
| **Location**        | Detailed location (Rack, Zone) where products are stored in the warehouse.                         | e.g., A-01-02 (Zone A, Rack 1, Shelf 2)           |
| **Lot**             | Group of products produced under the same production conditions (same parent roll, same date).     | Core unit of Traceability                         |
| **Available Stock** | Inventory currently in the warehouse and immediately available for sales or processing input.      | Total Stock - Reserved Stock                      |
| **Reserved Stock**  | Inventory waiting for shipment due to received orders or issued production orders.                 | Excluded when calculating available stock         |
| **Safety Stock**    | Minimum inventory to be held at all times to prepare for lead time and demand fluctuations.        | Set based on grammage/width per item              |

---

## 4. Import Terms

Terms related to overseas sourcing and purchasing processes.

| Term                    | Description                                                                                           | Note                                            |
| :---------------------- | :---------------------------------------------------------------------------------------------------- | :---------------------------------------------- |
| **Purchase Order (PO)** | The act of ordering by specifying item, quantity, and price to the supplier.                          | System automatically generates PO number        |
| **Partner/Vendor**      | Collectively refers to manufacturers supplying goods or customers purchasing goods.                   | Manage domestic/overseas partners separately    |
| **Shipment**            | The stage where products are loaded onto a ship or plane and transport begins.                        | B/L (Bill of Lading) issuance time              |
| **Arrival**             | Transport vehicle arriving at the destination port (mainly Busan Port, Incheon Port).                 | Manage ETA (Expected Time of Arrival)           |
| **Customs Clearance**   | The process of declaring imports to customs, paying tariffs and VAT, and obtaining import permission. | Proceed through customs broker                  |
| **Invoice**             | A bill stating transaction details and amount, serving as the basis for payment.                      | Commercial Invoice (C/I)                        |
| **L/C**                 | Letter of Credit. A payment condition where the bank guarantees payment.                              | Mainly used when trading with large paper mills |
| **T/T**                 | Telegraphic Transfer. Payment via bank transfer.                                                      | Post-remittance or advance payment              |
| **FOB**                 | Free On Board. The exporter bears costs until the point of loading onto the ship.                     | CHISAN Paper bears ocean freight and insurance  |
| **CIF**                 | Cost, Insurance, Freight. The exporter bears costs up to the destination port.                        | Freight/Insurance included in import unit price |
| **Lead Time**           | Total time taken from order placement to warehouse stock-in.                                          | Usually 60~90 days for imports from Finland     |
| **MOQ**                 | Min. Order Quantity. Minimum quantity to order at one time.                                           | Based on Container (20ft/40ft) unit             |

---

## 5. Production Terms

Terms related to slitting processing.

| Term                  | Description                                                                                        | Formula                                          |
| :-------------------- | :------------------------------------------------------------------------------------------------- | :----------------------------------------------- |
| **Slitting**          | A process of cutting wide parent rolls into narrow rolls using rotating blades.                    | -                                                |
| **Production Order**  | A document instructing the field on items, specifications, quantity, and schedule to be processed. | Job Ticket                                       |
| **Input/Consumption** | Raw material (Parent Roll) issued from warehouse and mounted on equipment for processing.          | Input Weight (kg)                                |
| **Output**            | Finished goods (Slitted Roll) and remnants produced as a result of processing.                     | Output Weight (kg)                               |
| **Loss Rate**         | Proportion of loss due to trim or defects occurring during the process.                            | `(Input - Output) / Input * 100`                 |
| **Yield**             | The ratio of actual finished product production compared to raw material input.                    | `Finished Product Weight / Input Weight * 100`   |
| **Trim/Waste**        | Scraps cut off to align both ends during slitting.                                                 | Treated as waste but data recording is mandatory |
| **Operator**          | A skilled worker who directly operates slitting equipment and performs tasks.                      | Subject of production performance registration   |

---

## 6. Business Terms

General business and administrative process terms.

| Term                           | Description                                                                             | Example                                     |
| :----------------------------- | :-------------------------------------------------------------------------------------- | :------------------------------------------ |
| **TDS** (Technical Data Sheet) | Technical data sheet listing physical and chemical properties of the product.           | Grammage, tensile strength, whiteness, etc. |
| **Approval**                   | Process where a superior reviews and approves documents or work details.                | PO approval, quotation approval             |
| **Quotation**                  | Presenting available price and conditions in advance at customer's request.             | Need to manage quotation validity period    |
| **Sales Order**                | State where a sales contract is established by receiving an order from a customer.      | Shipment management based on SO number      |
| **Closing**                    | The act of finalizing and settling transactions for a specific period (month, quarter). | Month-end tax invoice issuance closing      |

---

## 7. System Terms

Terms related to platform construction and IT technology.

| Term          | Full Name                         | Description                                                                                 |
| :------------ | :-------------------------------- | :------------------------------------------------------------------------------------------ |
| **WMS**       | Warehouse Management System       | System managing stock-in/out, location, and inventory status in the warehouse.              |
| **ERP**       | Enterprise Resource Planning      | Integrated management system for HR, accounting, import, and sales.                         |
| **RLS**       | Row Level Security                | Security technology controlling access rights per user for each row in the database.        |
| **DAG**       | Directed Acyclic Graph            | Used to express Parent Roll-Processing-Product relationships when tracking product lineage. |
| **API**       | Application Programming Interface | Protocol for data communication between systems.                                            |
| **Audit Log** | Audit Log                         | Log recording history of data creation, modification, and deletion to track changes.        |

---

## 8. Units

Standard units used for measurement and quantity indication.

| Unit      | Description | Usage Area                                         | Example                    |
| :-------- | :---------- | :------------------------------------------------- | :------------------------- |
| **g/m²**  | Grammage    | Paper spec definition                              | 80 g/m² (Copy paper level) |
| **mm**    | Millimeter  | All dimensions like width, diameter, core ID       | 1000mm Width               |
| **kg**    | Kilogram    | Product weight, input/output weight                | 500kg Roll                 |
| **m**     | Meter       | Total length of roll                               | 5000m Length               |
| **roll**  | Roll        | Count of roll products                             | 10 rolls                   |
| **sheet** | Sheet       | Count of sheet products                            | 500 sheets                 |
| **R**     | Ream        | Bulk quantity unit for sheets (usually 500 sheets) | 10 Reams                   |

---

## 9. Status Codes

Major status values managed within the system.

- **Inventory Status**:
  - `AVAILABLE`: Available (Immediate stock-out possible)
  - `RESERVED`: Reserved (Waiting for order/processing)
  - `IN_TRANSIT`: In Transit (Before arrival)
  - `QUARANTINED`: Quarantined (Quality issue occurred)
  - `DISPOSED`: Disposed (Excluded from inventory)

- **Import Status**:
  - `DRAFT`: Draft
  - `ORDERED`: Ordered
  - `SHIPPED`: Shipped
  - `ARRIVED`: Arrived
  - `CLEARED`: Cleared
  - `RECEIVED`: Received
