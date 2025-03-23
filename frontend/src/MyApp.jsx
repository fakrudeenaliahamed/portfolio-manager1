import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Flex,
  ChakraProvider,
  Button,
  Skeleton,
  Alert,
  AlertIcon,
  Input,
  FormControl,
  FormLabel,
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
import BucketTrades from "./components/bucketTrades.jsx";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
  UserButton,
  ClerkProvider,
} from "@clerk/clerk-react";

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
  const response = await fetch(`${API_BASE_URL}/api/buckets`, {
    credentials: "include",
  });
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

function MyApp() {
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
          Welcome to My Trades <UserButton />
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
      </Flex>
    </ChakraProvider>
  );
}

export default MyApp;
