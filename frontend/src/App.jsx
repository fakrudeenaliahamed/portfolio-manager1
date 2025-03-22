import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Flex,
  ChakraProvider,
  Button,
  Collapse,
  Card,
  CardHeader,
  CardBody,
  Skeleton,
  Alert,
  AlertIcon,
  Text,
  Input,
  FormControl,
  FormLabel,
  Select,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from "@chakra-ui/react";
import { extendTheme } from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";

// Define a custom theme
// Define a custom theme with tighter spacing
const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg: "gray.50",
        color: "gray.800",
        margin: 0,
      },
    },
  },
  components: {
    Table: {
      baseStyle: {
        th: { fontSize: "sm", p: 2 }, // Smaller headers
        td: { fontSize: "sm", p: 2 }, // Smaller cells
      },
    },
    Card: {
      baseStyle: {
        container: { p: 2, mb: 2 }, // Reduced padding and margin
      },
    },
    Button: {
      baseStyle: {
        fontSize: "sm", // Smaller buttons
        p: 2,
      },
    },
    Input: {
      baseStyle: {
        field: { fontSize: "sm", p: 2 }, // Smaller inputs
      },
    },
    Select: {
      baseStyle: {
        field: { fontSize: "sm", p: 2 }, // Smaller selects
      },
    },
  },
});

// API functions (unchanged)
const fetchBucketsData = async () => {
  const response = await fetch("http://localhost:5001/api/buckets");
  if (!response.ok)
    throw new Error(`Failed to fetch buckets: ${response.status}`);
  const data = await response.json();
  return data.buckets;
};

const createBucket = async (name) => {
  const response = await fetch("http://localhost:5001/api/buckets", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, trades: [] }),
  });
  if (!response.ok)
    throw new Error(`Failed to create bucket: ${response.status}`);
  return response.json();
};

const addTrade = async (bucketId, tradeData) => {
  const response = await fetch(
    `http://localhost:5001/api/buckets/${bucketId}/trades`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tradeData),
    }
  );
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      `Failed to add trade: ${response.status} - ${errorData.message}`
    );
  }
  return response.json();
};

const updateTrade = async (bucketId, tradeId, tradeData) => {
  const response = await fetch(
    `http://localhost:5001/api/buckets/${bucketId}/trades/${tradeId}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tradeData),
    }
  );
  if (!response.ok)
    throw new Error(`Failed to update trade: ${response.status}`);
  return response.json();
};

function BucketTrades({ bucketData, onAddTrade, onUpdateTrade }) {
  const [isOpen, setIsOpen] = useState(false);
  const {
    isOpen: isTradeOpen,
    onOpen: onTradeOpen,
    onClose: onTradeClose,
  } = useDisclosure();
  const [tradeData, setTradeData] = useState({
    instrument: "",
    qty: "",
    avg: "",
    ltp: "",
    status: "open",
    sellPrice: null,
  });
  const [editingTrade, setEditingTrade] = useState(null);

  const toggleTrades = () => setIsOpen(!isOpen);

  const handleTradeChange = (e) => {
    const { name, value } = e.target;
    setTradeData((prev) => ({
      ...prev,
      [name]:
        name === "qty" ||
        name === "avg" ||
        name === "ltp" ||
        name === "sellPrice"
          ? parseFloat(value) || ""
          : value,
    }));
  };

  const handleAddTrade = async () => {
    const { instrument, qty, avg, ltp, status, sellPrice } = tradeData;
    if (!instrument || !qty || !avg || !ltp) {
      alert("Please fill all required fields with valid values.");
      return;
    }
    try {
      await onAddTrade(bucketData._id, {
        instrument,
        qty: Number(qty),
        avg: Number(avg),
        ltp: Number(ltp),
        status,
        sellPrice: status === "closed" ? Number(sellPrice) : null,
      });
      setTradeData({
        instrument: "",
        qty: "",
        avg: "",
        ltp: "",
        status: "open",
        sellPrice: null,
      });
      onTradeClose();
    } catch (error) {
      alert(`Failed to add trade: ${error.message}`);
    }
  };

  const handleEditTrade = (trade) => {
    setEditingTrade(trade);
    setTradeData({ ...trade, sellPrice: trade.sellPrice || null });
    onTradeOpen();
  };

  const handleUpdateTrade = async () => {
    try {
      const updatedTradeData = {
        ...editingTrade, // Keep original values for immutable fields
        ltp: Number(tradeData.ltp), // Allow LTP to be updated
        status: tradeData.status, // Allow status to be updated
        sellPrice:
          tradeData.status === "closed" ? Number(tradeData.sellPrice) : null, // Allow sellPrice to be updated
      };
      await onUpdateTrade(bucketData._id, editingTrade._id, updatedTradeData);
      setEditingTrade(null);
      setTradeData({
        instrument: "",
        qty: "",
        avg: "",
        ltp: "",
        status: "open",
        sellPrice: null,
      });
      onTradeClose();
    } catch (error) {
      alert(`Failed to update trade: ${error.message}`);
    }
  };

  if (!bucketData) return <Skeleton height="200px" w="100%" />;

  return (
    <Card w="100%" bg="white" borderRadius="lg" shadow="md" mb={4}>
      <CardHeader>
        <Flex justify="space-between" align="center" w="100%">
          <Button
            variant="ghost"
            onClick={toggleTrades}
            fontWeight="semibold"
            color="gray.700"
            _hover={{ bg: "gray.100" }}
            p={2}
            w="100%"
            justifyContent="space-between"
          >
            <Flex align="center">
              <Heading size="md" mr={4}>
                {bucketData.name}
              </Heading>
              <Text
                fontSize="sm"
                color={
                  bucketData.totalProfitAndLoss >= 0 ? "green.500" : "red.500"
                }
              >
                Total P&L: {bucketData.totalProfitAndLoss.toFixed(2)}
              </Text>
            </Flex>
            {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </Button>
        </Flex>
      </CardHeader>
      <Collapse in={isOpen} animateOpacity>
        <CardBody w="100%">
          <Button colorScheme="blue" mb={4} onClick={onTradeOpen}>
            Add Trade
          </Button>
          {bucketData.trades && bucketData.trades.length > 0 ? (
            <TableContainer w="100%">
              <Table variant="striped" size="md" w="100%">
                <Thead bg="gray.100">
                  <Tr>
                    <Th scope="col" color="gray.600" fontWeight="medium">
                      Instrument
                    </Th>
                    <Th scope="col" color="gray.600" fontWeight="medium">
                      Quantity
                    </Th>
                    <Th scope="col" color="gray.600" fontWeight="medium">
                      Average Price
                    </Th>
                    <Th scope="col" color="gray.600" fontWeight="medium">
                      Last Traded Price
                    </Th>
                    <Th scope="col" color="gray.600" fontWeight="medium">
                      Status
                    </Th>
                    <Th scope="col" color="gray.600" fontWeight="medium">
                      Sell Price
                    </Th>
                    <Th scope="col" color="gray.600" fontWeight="medium">
                      Profit/Loss
                    </Th>
                    <Th scope="col" color="gray.600" fontWeight="medium">
                      Actions
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bucketData.trades.map((trade, index) => (
                    <Tr key={index}>
                      <Td fontWeight="medium" color="gray.700">
                        {trade.instrument}
                      </Td>
                      <Td color="gray.700">{trade.qty}</Td>
                      <Td color="blue.500">{trade.avg.toFixed(2)}</Td>
                      <Td color="green.500">{trade.ltp.toFixed(2)}</Td>
                      <Td>
                        <Badge
                          variant="outline"
                          colorScheme={
                            trade.status === "open" ? "green" : "red"
                          }
                        >
                          {trade.status}
                        </Badge>
                      </Td>
                      <Td color="gray.700">
                        {trade.sellPrice ? trade.sellPrice.toFixed(2) : "N/A"}
                      </Td>
                      <Td
                        color={
                          trade.profitAndLoss >= 0 ? "green.500" : "red.500"
                        }
                      >
                        {trade.profitAndLoss.toFixed(2)}
                      </Td>
                      <Td>
                        <Button
                          size="sm"
                          onClick={() => handleEditTrade(trade)}
                        >
                          Edit
                        </Button>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          ) : (
            <Box p={4} textAlign="center" color="gray.500" w="100%">
              No trades in this bucket.
            </Box>
          )}
        </CardBody>
      </Collapse>

      {/* Trade Modal */}
      <Modal isOpen={isTradeOpen} onClose={onTradeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>{editingTrade ? "Edit Trade" : "Add Trade"}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl mb={4}>
              <FormLabel>Instrument</FormLabel>
              <Input
                name="instrument"
                value={tradeData.instrument}
                onChange={handleTradeChange}
                isDisabled={!!editingTrade} // Disabled when editing
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Quantity</FormLabel>
              <Input
                name="qty"
                type="number"
                value={tradeData.qty}
                onChange={handleTradeChange}
                isDisabled={!!editingTrade} // Disabled when editing
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Average Price</FormLabel>
              <Input
                name="avg"
                type="number"
                value={tradeData.avg}
                onChange={handleTradeChange}
                isDisabled={!!editingTrade} // Disabled when editing
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Last Traded Price</FormLabel>
              <Input
                name="ltp"
                type="number"
                value={tradeData.ltp}
                onChange={handleTradeChange}
                // Enabled in both add and edit modes
              />
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Status</FormLabel>
              <Select
                name="status"
                value={tradeData.status}
                onChange={handleTradeChange}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Select>
            </FormControl>
            <FormControl mb={4}>
              <FormLabel>Sell Price</FormLabel>
              <Input
                name="sellPrice"
                type="number"
                value={tradeData.sellPrice || ""}
                onChange={handleTradeChange}
                isDisabled={tradeData.status === "open"} // Disabled if status is open
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="blue"
              mr={3}
              onClick={editingTrade ? handleUpdateTrade : handleAddTrade}
            >
              {editingTrade ? "Update" : "Add"}
            </Button>
            <Button variant="ghost" onClick={onTradeClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Card>
  );
}

function App() {
  const [bucketsData, setBucketsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [newBucketName, setNewBucketName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetchBucketsData();
        setBucketsData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateBucket = async () => {
    try {
      const result = await createBucket(newBucketName);
      setBucketsData((prev) => [...prev, result.bucket]);
      setNewBucketName("");
      onClose();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddTrade = async (bucketId, tradeData) => {
    const result = await addTrade(bucketId, tradeData);
    setBucketsData((prev) =>
      prev.map((bucket) => (bucket._id === bucketId ? result.bucket : bucket))
    );
  };

  const handleUpdateTrade = async (bucketId, tradeId, tradeData) => {
    const result = await updateTrade(bucketId, tradeId, tradeData);
    setBucketsData((prev) =>
      prev.map((bucket) => (bucket._id === bucketId ? result.bucket : bucket))
    );
  };

  return (
    <ChakraProvider theme={theme}>
      <Flex
        direction="column"
        align="flex-start"
        justify="flex-start"
        minHeight="100vh"
        w="100vw"
        pt={8}
        pb={8}
        px={0}
      >
        <Heading mb={4} textAlign="center" w="100%">
          My Trades
        </Heading>
        <Button colorScheme="teal" mb={4} mx="auto" onClick={onOpen}>
          Add Bucket
        </Button>
        {loading ? (
          <Box w="100%">
            <Skeleton height="200px" w="100%" />
          </Box>
        ) : error ? (
          <Alert status="error" w="100%">
            <AlertIcon />
            <Box>
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        ) : !bucketsData || bucketsData.length === 0 ? (
          <Alert status="warning" w="100%">
            <AlertIcon />
            <Box>
              <AlertTitle>No Data</AlertTitle>
              <AlertDescription>No bucket data available.</AlertDescription>
            </Box>
          </Alert>
        ) : (
          <Box w="100%">
            {bucketsData.map((bucket) => (
              <BucketTrades
                key={bucket._id}
                bucketData={bucket}
                onAddTrade={handleAddTrade}
                onUpdateTrade={handleUpdateTrade}
              />
            ))}
          </Box>
        )}
      </Flex>

      {/* Add Bucket Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Bucket</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Bucket Name</FormLabel>
              <Input
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="teal" mr={3} onClick={handleCreateBucket}>
              Create
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
}

export default App;
