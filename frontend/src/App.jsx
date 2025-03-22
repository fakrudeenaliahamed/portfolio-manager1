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

// Define a custom theme with responsive adjustments
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
        th: { fontSize: ["xs", "sm"], p: [1, 2] },
        td: { fontSize: ["xs", "sm"], p: [1, 2] },
      },
    },
    Card: {
      baseStyle: {
        container: { p: [1, 2], mb: [1, 2] },
      },
    },
    Button: {
      baseStyle: {
        fontSize: ["xs", "sm"],
        p: [1, 2],
      },
    },
    Input: {
      baseStyle: {
        field: { fontSize: ["xs", "sm"], p: [1, 2] },
      },
    },
    Select: {
      baseStyle: {
        field: { fontSize: ["xs", "sm"], p: [1, 2] },
      },
    },
  },
  breakpoints: {
    base: "0em", // Mobile (0px)
    sm: "30em", // Small (480px)
    md: "48em", // Medium (768px)
    lg: "62em", // Large (992px)
    xl: "80em", // Extra large (1280px)
  },
});

// API functions with environment variable support
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ""; // Empty for relative URLs

const fetchBucketsData = async () => {
  const response = await fetch(`${API_BASE_URL}/api/buckets`);
  if (!response.ok)
    throw new Error(`Failed to fetch buckets: ${response.status}`);
  const data = await response.json();
  return data.buckets;
};

const createBucket = async (name) => {
  const response = await fetch(`${API_BASE_URL}/api/buckets`, {
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
    `${API_BASE_URL}/api/buckets/${bucketId}/trades`,
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
    `${API_BASE_URL}/api/buckets/${bucketId}/trades/${tradeId}`,
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
        ...editingTrade,
        ltp: Number(tradeData.ltp),
        status: tradeData.status,
        sellPrice:
          tradeData.status === "closed" ? Number(tradeData.sellPrice) : null,
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

  if (!bucketData) return <Skeleton height={["80px", "100px"]} w="100%" />;

  return (
    <Card w="100%" bg="white" borderRadius="md" shadow="sm">
      <CardHeader p={[1, 2]}>
        <Flex justify="space-between" align="center" w="100%">
          <Button
            variant="ghost"
            onClick={toggleTrades}
            fontWeight="medium"
            color="gray.700"
            _hover={{ bg: "gray.100" }}
            size="sm"
            w="100%"
            p={[1, 2]}
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Flex
              align="center"
              justify={["center", "flex-start"]}
              flex="1"
              direction={["column", "row"]}
              textAlign={["center", "left"]}
            >
              <Heading size={["sm", "md"]} mr={[0, 2]} mb={[1, 0]}>
                {bucketData.name}
              </Heading>
              <Text
                fontSize={["xs", "sm"]}
                color={
                  bucketData.totalProfitAndLoss >= 0 ? "green.500" : "red.500"
                }
              >
                P&L: {bucketData.totalProfitAndLoss.toFixed(2)}
              </Text>
            </Flex>
            <Box flexShrink={0} display="flex" alignItems="center">
              {isOpen ? (
                <ChevronUp
                  size={16}
                  style={{ width: "16px", height: "16px" }}
                />
              ) : (
                <ChevronDown
                  size={16}
                  style={{ width: "16px", height: "16px" }}
                />
              )}
            </Box>
          </Button>
        </Flex>
      </CardHeader>
      <Collapse in={isOpen} animateOpacity>
        <CardBody p={[1, 2]}>
          <Button
            colorScheme="blue"
            size="sm"
            mb={[1, 2]}
            onClick={onTradeOpen}
          >
            Add Trade
          </Button>
          {bucketData.trades && bucketData.trades.length > 0 ? (
            <TableContainer w="100%" overflowX="auto">
              <Table variant="striped" size="sm">
                <Thead bg="gray.100">
                  <Tr>
                    <Th>Instrument</Th>
                    <Th>Qty</Th>
                    <Th>Avg</Th>
                    <Th>LTP</Th>
                    <Th>Status</Th>
                    <Th>Sell</Th>
                    <Th>P&L</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bucketData.trades.map((trade, index) => (
                    <Tr key={index}>
                      <Td fontWeight="medium">{trade.instrument}</Td>
                      <Td>{trade.qty}</Td>
                      <Td color="blue.500">{trade.avg.toFixed(2)}</Td>
                      <Td color="green.500">{trade.ltp.toFixed(2)}</Td>
                      <Td>
                        <Badge
                          variant="outline"
                          colorScheme={
                            trade.status === "open" ? "green" : "red"
                          }
                          fontSize={["xs", "sm"]}
                        >
                          {trade.status}
                        </Badge>
                      </Td>
                      <Td>
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
                          size="xs"
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
            <Box textAlign="center" color="gray.500" fontSize={["xs", "sm"]}>
              No trades
            </Box>
          )}
        </CardBody>
      </Collapse>

      {/* Trade Modal */}
      <Modal isOpen={isTradeOpen} onClose={onTradeClose} size={["xs", "sm"]}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize={["sm", "md"]}>
            {editingTrade ? "Edit Trade" : "Add Trade"}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody p={[2, 3]}>
            <FormControl mb={[1, 2]}>
              <FormLabel fontSize={["xs", "sm"]}>Instrument</FormLabel>
              <Input
                name="instrument"
                value={tradeData.instrument}
                onChange={handleTradeChange}
                isDisabled={!!editingTrade}
              />
            </FormControl>
            <FormControl mb={[1, 2]}>
              <FormLabel fontSize={["xs", "sm"]}>Quantity</FormLabel>
              <Input
                name="qty"
                type="number"
                value={tradeData.qty}
                onChange={handleTradeChange}
                isDisabled={!!editingTrade}
              />
            </FormControl>
            <FormControl mb={[1, 2]}>
              <FormLabel fontSize={["xs", "sm"]}>Average Price</FormLabel>
              <Input
                name="avg"
                type="number"
                value={tradeData.avg}
                onChange={handleTradeChange}
                isDisabled={!!editingTrade}
              />
            </FormControl>
            <FormControl mb={[1, 2]}>
              <FormLabel fontSize={["xs", "sm"]}>Last Traded Price</FormLabel>
              <Input
                name="ltp"
                type="number"
                value={tradeData.ltp}
                onChange={handleTradeChange}
              />
            </FormControl>
            <FormControl mb={[1, 2]}>
              <FormLabel fontSize={["xs", "sm"]}>Status</FormLabel>
              <Select
                name="status"
                value={tradeData.status}
                onChange={handleTradeChange}
              >
                <option value="open">Open</option>
                <option value="closed">Closed</option>
              </Select>
            </FormControl>
            <FormControl mb={[1, 2]}>
              <FormLabel fontSize={["xs", "sm"]}>Sell Price</FormLabel>
              <Input
                name="sellPrice"
                type="number"
                value={tradeData.sellPrice || ""}
                onChange={handleTradeChange}
                isDisabled={tradeData.status === "open"}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter p={[1, 2]}>
            <Button
              colorScheme="blue"
              size="sm"
              mr={[1, 2]}
              onClick={editingTrade ? handleUpdateTrade : handleAddTrade}
            >
              {editingTrade ? "Update" : "Add"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onTradeClose}>
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
        align="center"
        justify="flex-start"
        minHeight="100vh"
        w="100vw"
        pt={[2, 4]}
        pb={[2, 4]}
        px={[1, 2]}
      >
        <Heading size={["md", "lg"]} mb={[1, 2]} textAlign="center" w="100%">
          My Trades
        </Heading>
        <Button colorScheme="teal" size="sm" mb={[1, 2]} onClick={onOpen}>
          Add Bucket
        </Button>
        {loading ? (
          <Box w="100%">
            <Skeleton height={["80px", "100px"]} w="100%" />
          </Box>
        ) : error ? (
          <Alert status="error" w="100%" fontSize={["xs", "sm"]} p={[1, 2]}>
            <AlertIcon boxSize={[3, 4]} />
            <Box>
              <AlertTitle fontSize={["xs", "sm"]}>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Box>
          </Alert>
        ) : !bucketsData || bucketsData.length === 0 ? (
          <Alert status="warning" w="100%" fontSize={["xs", "sm"]} p={[1, 2]}>
            <AlertIcon boxSize={[3, 4]} />
            <Box>
              <AlertTitle fontSize={["xs", "sm"]}>No Data</AlertTitle>
              <AlertDescription>No buckets available.</AlertDescription>
            </Box>
          </Alert>
        ) : (
          <Box w={["100%", "90%", "80%"]} maxW="1200px">
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
      <Modal isOpen={isOpen} onClose={onClose} size={["xs", "sm"]}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader fontSize={["sm", "md"]}>Add New Bucket</ModalHeader>
          <ModalCloseButton />
          <ModalBody p={[2, 3]}>
            <FormControl>
              <FormLabel fontSize={["xs", "sm"]}>Bucket Name</FormLabel>
              <Input
                value={newBucketName}
                onChange={(e) => setNewBucketName(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter p={[1, 2]}>
            <Button
              colorScheme="teal"
              size="sm"
              mr={[1, 2]}
              onClick={handleCreateBucket}
            >
              Create
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </ChakraProvider>
  );
}

export default App;
