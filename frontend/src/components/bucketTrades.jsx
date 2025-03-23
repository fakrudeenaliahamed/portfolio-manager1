import React, { useState } from "react";
import { useDisclosure } from "@chakra-ui/react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Heading,
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Collapse,
  Text,
  Badge,
} from "@chakra-ui/react";
import { ChevronDown, ChevronUp } from "lucide-react";

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

export default BucketTrades;
